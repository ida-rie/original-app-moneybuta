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

const results = [];
const add = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}: ${detail}`);
};

const jstDayRangeUtc = (offsetDays = 0) => {
  const now = new Date();
  const jstNow = new Date(now.toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).replace(' ', 'T'));
  jstNow.setDate(jstNow.getDate() + offsetDays);
  const startJst = new Date(jstNow);
  startJst.setHours(0, 0, 0, 0);
  const endJst = new Date(jstNow);
  endJst.setHours(23, 59, 59, 999);
  const offset = 9 * 60 * 60 * 1000;
  return {
    start: new Date(startJst.getTime() - offset),
    end: new Date(endJst.getTime() - offset),
  };
};

const monthStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
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
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
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

try {
  const suffix = Date.now();
  const parentAPass = 'TestParentA_123';
  const parentBPass = 'TestParentB_123';
  const childAPass = 'TestChildA_123';
  const childBPass = 'TestChildB_123';

  const parentAEmail = `qa-parent-a-${suffix}@moneybuta.local`;
  const parentBEmail = `qa-parent-b-${suffix}@moneybuta.local`;

  const parentAId = await createAuthUser(parentAEmail, parentAPass, 'QA Parent A');
  const parentBId = await createAuthUser(parentBEmail, parentBPass, 'QA Parent B');

  await prisma.user.create({ data: { id: parentAId, email: parentAEmail, name: 'QA Parent A', role: 'parent' } });
  await prisma.user.create({ data: { id: parentBId, email: parentBEmail, name: 'QA Parent B', role: 'parent' } });
  createdDbUserIds.push(parentAId, parentBId);

  const parentA = await signIn(parentAEmail, parentAPass);
  const parentB = await signIn(parentBEmail, parentBPass);

  const childACreate = await api('/api/users/signup', parentA.token, {
    method: 'POST',
    body: JSON.stringify({
      name: 'QA Child A',
      role: 'child',
      parentId: parentAId,
      loginId: `qa-child-a-${suffix}`,
      password: childAPass,
    }),
  });
  if (childACreate.status !== 201) throw new Error(`child A create failed: status=${childACreate.status}`);
  const childAId = childACreate.json.id;
  const childAEmail = childACreate.json.email;
  createdDbUserIds.push(childAId);
  createdAuthUserIds.push(childAId);

  const childBCreate = await api('/api/users/signup', parentB.token, {
    method: 'POST',
    body: JSON.stringify({
      name: 'QA Child B',
      role: 'child',
      parentId: parentBId,
      loginId: `qa-child-b-${suffix}`,
      password: childBPass,
    }),
  });
  if (childBCreate.status !== 201) throw new Error(`child B create failed: status=${childBCreate.status}`);
  const childBId = childBCreate.json.id;
  createdDbUserIds.push(childBId);
  createdAuthUserIds.push(childBId);

  const childA = await signIn(childAEmail, childAPass);

  const today = jstDayRangeUtc(0);
  const yesterday = jstDayRangeUtc(-1);

  const base = await prisma.baseQuest.create({
    data: {
      userId: parentAId,
      childUserId: childAId,
      title: 'QA てすとクエスト',
      reward: 100,
    },
  });
  createdBaseQuestIds.push(base.id);

  const todayQuest = await prisma.questHistory.create({
    data: {
      baseQuestId: base.id,
      childUserId: childAId,
      title: 'QA てすとクエスト',
      reward: 100,
      questDate: today.start,
      completed: false,
      approved: false,
    },
  });
  createdQuestIds.push(todayQuest.id);

  const oldQuest = await prisma.questHistory.create({
    data: {
      baseQuestId: base.id,
      childUserId: childAId,
      title: 'QA きのうクエスト',
      reward: 80,
      questDate: yesterday.start,
      completed: true,
      completedAt: yesterday.start,
      completedBy: childAId,
      approved: true,
      approvedAt: yesterday.end,
      approvedBy: parentAId,
    },
  });
  createdQuestIds.push(oldQuest.id);

  const complete1 = await api(`/api/quests/${todayQuest.id}/complete`, childA.token, { method: 'PUT' });
  add('子A1が完了できる', complete1.status === 200, `status=${complete1.status}`);

  const uncomplete1 = await api(`/api/quests/${todayQuest.id}/complete`, childA.token, { method: 'DELETE' });
  add('子A1が完了を取り消せる', uncomplete1.status === 200, `status=${uncomplete1.status}`);

  const uncomplete2 = await api(`/api/quests/${todayQuest.id}/complete`, childA.token, { method: 'DELETE' });
  add('未完了の取り消しは409', uncomplete2.status === 409, `status=${uncomplete2.status}`);

  const completeAgain = await api(`/api/quests/${todayQuest.id}/complete`, childA.token, { method: 'PUT' });
  add('子A1が再度完了できる', completeAgain.status === 200, `status=${completeAgain.status}`);

  const uncompleteByParent = await api(`/api/quests/${todayQuest.id}/complete`, parentA.token, { method: 'DELETE' });
  add('親Aの完了取り消しは403', uncompleteByParent.status === 403, `status=${uncompleteByParent.status}`);

  const approve1 = await api(`/api/quests/${todayQuest.id}/approve`, parentA.token, { method: 'PUT' });
  add('親Aが承認できる', approve1.status === 200, `status=${approve1.status}`);

  const uncompleteAfterApprove = await api(`/api/quests/${todayQuest.id}/complete`, childA.token, { method: 'DELETE' });
  add('承認済みの完了取り消しは409', uncompleteAfterApprove.status === 409, `status=${uncompleteAfterApprove.status}`);

  const complete2 = await api(`/api/quests/${todayQuest.id}/complete`, childA.token, { method: 'PUT' });
  add('再完了は409', complete2.status === 409, `status=${complete2.status}`);

  const approve2 = await api(`/api/quests/${todayQuest.id}/approve`, parentA.token, { method: 'PUT' });
  add('再承認は409', approve2.status === 409, `status=${approve2.status}`);

  const revoke1 = await api(`/api/quests/${todayQuest.id}/approve`, parentA.token, { method: 'DELETE' });
  add('当日承認の解除ができる', revoke1.status === 200, `status=${revoke1.status}`);

  const revoke2 = await api(`/api/quests/${todayQuest.id}/approve`, parentA.token, { method: 'DELETE' });
  add('未承認解除は409', revoke2.status === 409, `status=${revoke2.status}`);

  const approve3 = await api(`/api/quests/${todayQuest.id}/approve`, parentA.token, { method: 'PUT' });
  add('解除後の再承認ができる', approve3.status === 200, `status=${approve3.status}`);

  const revokeByChild = await api(`/api/quests/${todayQuest.id}/approve`, childA.token, { method: 'DELETE' });
  add('子A1の解除は403', revokeByChild.status === 403, `status=${revokeByChild.status}`);

  const revokeByOtherParent = await api(`/api/quests/${todayQuest.id}/approve`, parentB.token, { method: 'DELETE' });
  add('親Bの解除は403', revokeByOtherParent.status === 403, `status=${revokeByOtherParent.status}`);

  const monthlyCross = await api(`/api/amount/monthly?childId=${childBId}&month=${monthStr()}`, parentA.token);
  add('他家庭 childId の月次取得は403', monthlyCross.status === 403, `status=${monthlyCross.status}`);

  const revokeOld = await api(`/api/quests/${oldQuest.id}/approve`, parentA.token, { method: 'DELETE' });
  add('前日以前承認の解除は409', revokeOld.status === 409, `status=${revokeOld.status}`);

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
