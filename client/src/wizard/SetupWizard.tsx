import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { APP_SETTINGS_KEY } from '../core/hooks/useAppSettings';
import StepShell from './StepShell';
import LanguageStep from './steps/LanguageStep';
import LocaleStep from './steps/LocaleStep';
import ProfilesStep from './steps/ProfilesStep';
import CalendarsStep from './steps/CalendarsStep';
import DisplayStep from './steps/DisplayStep';
import OrientationStep from './steps/OrientationStep';
import VoiceStep from './steps/VoiceStep';
import FeaturesStep from './steps/FeaturesStep';
import PluginsStep from './steps/PluginsStep';
import DoneStep from './steps/DoneStep';

const TOTAL_STEPS = 10;

export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set());
  const qc = useQueryClient();

  function goNext() {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  function skipStep() {
    setSkippedSteps((prev) => new Set(prev).add(currentStep));
    goNext();
  }

  function onFinish() {
    void qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
  }

  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <StepShell title="Choose your language" currentStep={currentStep} isFirst>
            <LanguageStep onNext={goNext} />
          </StepShell>
        );
      case 1:
        return (
          <StepShell title="Regional settings" currentStep={currentStep} onBack={goBack}>
            <LocaleStep onNext={goNext} />
          </StepShell>
        );
      case 2:
        return (
          <StepShell title="Household profiles" currentStep={currentStep} onBack={goBack}>
            <ProfilesStep onNext={goNext} />
          </StepShell>
        );
      case 3:
        return (
          <StepShell title="Calendar accounts" currentStep={currentStep} onBack={goBack}>
            <CalendarsStep onNext={goNext} onSkip={skipStep} />
          </StepShell>
        );
      case 4:
        return (
          <StepShell title="Display settings" currentStep={currentStep} onBack={goBack}>
            <DisplayStep onNext={goNext} />
          </StepShell>
        );
      case 5:
        return (
          <StepShell title="Screen orientation" currentStep={currentStep} onBack={goBack}>
            <OrientationStep onNext={goNext} />
          </StepShell>
        );
      case 6:
        return (
          <StepShell title="Voice control" currentStep={currentStep} onBack={goBack}>
            <VoiceStep onNext={goNext} onSkip={skipStep} />
          </StepShell>
        );
      case 7:
        return (
          <StepShell title="Navigation sections" currentStep={currentStep} onBack={goBack}>
            <FeaturesStep onNext={goNext} />
          </StepShell>
        );
      case 8:
        return (
          <StepShell title="Plugins" currentStep={currentStep} onBack={goBack}>
            <PluginsStep onNext={goNext} />
          </StepShell>
        );
      case 9:
        return (
          <StepShell title="All done!" currentStep={currentStep} onBack={goBack}>
            <DoneStep skippedSteps={skippedSteps} onFinish={onFinish} />
          </StepShell>
        );
      default:
        return null;
    }
  }

  return <div data-testid="setup-wizard">{renderStep()}</div>;
}
