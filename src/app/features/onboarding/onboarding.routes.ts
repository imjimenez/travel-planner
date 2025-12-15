import { TripWizardComponent } from "@shared/components/trips/tripWizard/trip-wizard.component";
import OnboardingLayout from "./components/onboarding-layout/onboarding-layout.component";
import { previousCompletedStepGuard, selectedStepGuard } from "./guards/onboarding.guard";
import DatesStep from "./pages/dates-step/dates-step";
import DestinationStep from "./pages/destination-step/destination-step.component";
import OnboardingWelcome from "./pages/onboarding-welcome/onboarding-welcome.component";
import { OnboardingStore } from "./stores/onboarding.store";
import MembersStep from "./pages/members-step/members-step";

const onboardingRoutes = [
  {
	path: 'old',
	component: TripWizardComponent
	},
	{
		path: "",
		component: OnboardingLayout,
		providers: [OnboardingStore],
		canActivateChild: [selectedStepGuard, previousCompletedStepGuard],
		children: [
			{
				path: "welcome",
				component: OnboardingWelcome,
				data: { step: 0 },
			},
			{
				path: "destination",
				component: DestinationStep,
				data: { step: 1 },
			},
			{
				path: "dates",
				component: DatesStep,
				data: { step: 2 },
			},
			{
				path: "members",
				component: MembersStep,
				data: { step: 3 },
			},
			{
				path: "**",
				redirectTo: "welcome",
			},
		],
	},
];
export default onboardingRoutes;
