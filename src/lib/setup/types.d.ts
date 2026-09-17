export type SetupRequirementCheck = {
	key: string;
	configured: boolean;
	message: string;
	/** Optional checks are reported but never block setup. Defaults to required. */
	required?: boolean;
};

export type SetupPreparationResult = {
	checks: SetupRequirementCheck[];
	migrated: boolean;
};
