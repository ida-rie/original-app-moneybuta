const isTrue = (value: string | undefined) => {
	return value === 'true';
};

export const isPushFeatureEnabled = () => {
	return isTrue(process.env.PUSH_FEATURE_ENABLED);
};

export const isPushTestEndpointEnabled = () => {
	return isTrue(process.env.PUSH_TEST_ENDPOINT_ENABLED);
};
