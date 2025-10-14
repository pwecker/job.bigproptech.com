import { ref, computed, provide, inject, type Ref, type ComputedRef, type InjectionKey } from 'vue'
import { useRoute } from 'vue-router'

export interface OnboardingStep {
  id: string
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void
}

export interface OnboardingState {
  steps: OnboardingStep[]
  currentStepIndex: number
  isActive: boolean
  completed: boolean
  reseted: boolean
}

interface OnboardingReturn {
  state: Ref<OnboardingState>
  currentStep: ComputedRef<OnboardingStep>
  isStepActive(stepId: string): boolean
  start(): void
  next(): void
  previous(): void
  skip(): void
  complete(): void
  reset(): void
}

const OnboardingKey: InjectionKey<ReturnType<typeof createOnboarding>> = Symbol('onboarding')

export function createOnboarding(steps: OnboardingStep[]): OnboardingReturn {
  const route = useRoute()

  // todo: needs to complete when hero not loaded
  const state = ref<OnboardingState>({
    steps,
    currentStepIndex: 0,
    isActive: false,
    completed: (route?.name !== 'grid' || !route?.meta.showHero),
    // completed: false,
    reseted: false
  })

  console.log(route?.name !== 'grid' || !route?.meta.showHero)

  const currentStep = computed(() => 
    state.value.steps[state.value.currentStepIndex]
  )

  const isStepActive = (stepId: string) => {
    return state.value.isActive && currentStep.value?.id === stepId
  }

  const start = () => {
    state.value.isActive = true
    state.value.currentStepIndex = 0
  }

  const next = () => {
    if (state.value.currentStepIndex < state.value.steps.length - 1) {
      currentStep.value?.action?.()
      state.value.currentStepIndex++
    } else {
      complete()
    }
  }

  const previous = () => {
    if (state.value.currentStepIndex > 0) {
      state.value.currentStepIndex--
    }
  }

  const skip = () => {
    complete()
  }

  const complete = () => {
    state.value.isActive = false
    state.value.completed = true
    localStorage.setItem('onboarding-completed', 'true')
  }

  const reset = () => {
    state.value.currentStepIndex = 0
    state.value.completed = false
    state.value.reseted = true
    localStorage.removeItem('onboarding-completed')
  }

  // localStorage.removeItem('onboarding-completed')

  return {
    state,
    currentStep,
    isStepActive,
    start,
    next,
    previous,
    skip,
    complete,
    reset
  }
}

export function provideOnboarding(steps: OnboardingStep[]) {
  const onboarding = createOnboarding(steps)
  provide(OnboardingKey, onboarding)
  return onboarding
}

export function useOnboarding() {
  const onboarding = inject(OnboardingKey)
  if (!onboarding) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return onboarding
}