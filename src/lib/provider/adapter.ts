import type { Variant } from "@/lib/domain/types";

export type ProviderLaunchResult = {
  provider_job_id: string;
  status: "queued" | "running" | "completed" | "failed";
};

export interface ProviderAdapter {
  name: string;
  launchVariant(variant: Variant): Promise<ProviderLaunchResult>;
}

export class MockProviderAdapter implements ProviderAdapter {
  name = "mock";

  async launchVariant(variant: Variant): Promise<ProviderLaunchResult> {
    return {
      provider_job_id: `mock_${variant.id}`,
      status: "queued",
    };
  }
}
