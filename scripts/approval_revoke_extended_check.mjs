import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env' });

const baseUrl = 'http://localhost:3001';
const prisma = new PrismaClient();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const createdAuthUserIds = [];
const createdDbUserIds = [];
const createdBaseQuestIds = [];
const createdQuestIds = [];
const createdBasicAmountIds = [];

const results = [];
const add = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}: ${detail}`);
};

const jstDayRangeUtc = () => {
  const now = new Date();
  const jstNow = new Date(now.toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).replace(' ', 'T'));
  const startJst = new Date(jstNow);
  startJst.setHours(0, 0, 0, 0);
  const endJst = new Date(jstNow);
  endJst.setHours(23, 59, 59, 999);
  const offset = 9 * 60 * 60 * 1000;
  return { start: new Date(startJst.getTime() - offset), end: new Date(endJst.getTime() - offset) };
};

const monthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const api = async (path, token, options = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  return { status: res.status, json, text };
};

const createAuthUser = async (email, password, name) => {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (error || !data?.user?.id) throw new Error(`auth create failed: ${error?.message ?? 'unknown'}`);
  createdAuthUserIds.push(data.user.id);
  return data.user.id;
};

const signIn = async (email, password) => {
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error || !data?.session?.access_token || !data?.user?.id) {
    throw new Error(`signin failed for ${email}: ${error?.message ?? 'unknown'}`);
  }
  return { token: data.session.access_token, userId: data.user.id };
};

const parseStatuses = (arr) => arr.map((x) => x.status).sort((a, b) => a - b).join(',');

try {
  const suffix = Date.now();
  const parentPass = 'QaParent_12345';
  const childPass = 'QaChild_12345';
  const reward = 123;

  const parentEmail = `qa2-parent-${suffix}@moneybuta.local`;
  const parentId = await createAuthUser(parentEmail, parentPass, 'QA2 Parent');
  await prisma.user.create({ data: { id: parentId, email: parentEmail, name: 'QA2 Parent', role: 'parent' } });
  createdDbUserIds.push(parentId);

  const parent = await signIn(parentEmail, parentPass);

  const childCreate = await api('/api/users/signup', parent.token, {
    method: 'POST',
    body: JSON.stringify({
      name: 'QA2 Child',
      role: 'child',
      parentId,
      loginId: `qa2-child-${suffix}`,
      password: childPass,
    }),
  });
  if (childCreate.status !== 201) throw new Error(`child create failed: status=${childCreate.status}`);
  const childId = childCreate.json.id;
  const childEmail = childCreate.json.email;
  createdDbUserIds.push(childId);
  createdAuthUserIds.push(childId);

  const child = await signIn(childEmail, childPass);

  const day = jstDayRangeUtc();

  const basic = await prisma.basicAmount.create({
    data: {
      userId: parentId,
      childUserId: childId,
      basicAmount: 0,
      month: monthStr(),
    },
  });
  createdBasicAmountIds.push(basic.id);

  const makeQuest = async (title) => {
    const base = await prisma.baseQuest.create({
      data: {
        userId: parentId,
        childUserId: childId,
        title,
        reward,
      },
    });
    createdBaseQuestIds.push(base.id);

    const q = await prisma.questHistory.create({
      data: {
        baseQuestId: base.id,
        childUserId: childId,
        title,
        reward,
        questDate: day.start,
        completed: true,
        completedAt: day.start,
        completedBy: childId,
        approved: false,
      },
    });
    createdQuestIds.push(q.id);
    return q;
  };

  // 1) 同時承認
  const q1 = await makeQuest('Race Approve');
  const [a1, a2] = await Promise.all([
    api(`/api/quests/${q1.id}/approve`, parent.token, { method: 'PUT' }),
    api(`/api/quests/${q1.id}/approve`, parent.token, { method: 'PUT' }),
  ]);
  add('同時承認は 200/409', parseStatuses([a1, a2]) === '200,409', `statuses=${parseStatuses([a1, a2])}`);

  // 2) 同時解除
  const q2 = await makeQuest('Race Revoke');
  const apprQ2 = await api(`/api/quests/${q2.id}/approve`, parent.token, { method: 'PUT' });
  if (apprQ2.status !== 200) throw new Error(`prep approve for revoke race failed: ${apprQ2.status}`);
  const [r1, r2] = await Promise.all([
    api(`/api/quests/${q2.id}/approve`, parent.token, { method: 'DELETE' }),
    api(`/api/quests/${q2.id}/approve`, parent.token, { method: 'DELETE' }),
  ]);
  add('同時解除は 200/409', parseStatuses([r1, r2]) === '200,409', `statuses=${parseStatuses([r1, r2])}`);

  // 3) 承認と解除の同時実行
  const q3 = await makeQuest('Race Approve-Revoke');
  const [ar1, ar2] = await Promise.all([
    api(`/api/quests/${q3.id}/approve`, parent.token, { method: 'PUT' }),
    api(`/api/quests/${q3.id}/approve`, parent.token, { method: 'DELETE' }),
  ]);
  const s = parseStatuses([ar1, ar2]);
  add('承認/解除同時は 200/409', s === '200,409', `statuses=${s}`);

  // 4) 月次 rewardSum の増減
  const q4 = await makeQuest('Monthly Impact');
  const before = await api(`/api/amount/monthly?childId=${childId}&month=${monthStr()}`, parent.token);
  if (before.status !== 200) throw new Error(`monthly before failed: ${before.status}`);

  const approveQ4 = await api(`/api/quests/${q4.id}/approve`, parent.token, { method: 'PUT' });
  if (approveQ4.status !== 200) throw new Error(`approve q4 failed: ${approveQ4.status}`);

  const afterApprove = await api(`/api/amount/monthly?childId=${childId}&month=${monthStr()}`, parent.token);
  if (afterApprove.status !== 200) throw new Error(`monthly after approve failed: ${afterApprove.status}`);

  const revokeQ4 = await api(`/api/quests/${q4.id}/approve`, parent.token, { method: 'DELETE' });
  if (revokeQ4.status !== 200) throw new Error(`revoke q4 failed: ${revokeQ4.status}`);

  const afterRevoke = await api(`/api/amount/monthly?childId=${childId}&month=${monthStr()}`, parent.token);
  if (afterRevoke.status !== 200) throw new Error(`monthly after revoke failed: ${afterRevoke.status}`);

  const beforeSum = before.json?.rewardSum ?? 0;
  const afterApproveSum = afterApprove.json?.rewardSum ?? 0;
  const afterRevokeSum = afterRevoke.json?.rewardSum ?? 0;

  add('承認で rewardSum が増える', afterApproveSum === beforeSum + reward, `before=${beforeSum} afterApprove=${afterApproveSum}`);
  add('解除で rewardSum が戻る', afterRevokeSum === beforeSum, `before=${beforeSum} afterRevoke=${afterRevokeSum}`);

  // child UI相当: 承認解除導線なしはコンポーネント分岐で保証されるため API では対象外
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log('\nSUMMARY');
  console.log(`total=${results.length} passed=${passed} failed=${failed}`);
  if (failed > 0) process.exitCode = 1;

} catch (e) {
  console.error('FATAL', e?.message ?? e);
  process.exitCode = 1;
} finally {
  try {
    if (createdBasicAmountIds.length > 0) {
      await prisma.basicAmount.deleteMany({ where: { id: { in: createdBasicAmountIds } } });
    }
    if (createdQuestIds.length > 0) {
      await prisma.questHistory.deleteMany({ where: { id: { in: createdQuestIds } } });
    }
    if (createdBaseQuestIds.length > 0) {
      await prisma.baseQuest.deleteMany({ where: { id: { in: createdBaseQuestIds } } });
    }
    if (createdDbUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdDbUserIds } } });
    }
  } catch (cleanupErr) {
    console.error('CLEANUP_DB_FAILED', cleanupErr?.message ?? cleanupErr);
  }

  for (const authId of createdAuthUserIds) {
    try {
      await admin.auth.admin.deleteUser(authId);
    } catch {}
  }

  await prisma.$disconnect();
}
