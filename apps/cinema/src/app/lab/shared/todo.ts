/** Thrown by a lab step that is still to be written. */
export class LabTodo extends Error {
  constructor(
    readonly step: string,
    hint: string,
  ) {
    super(`${step} is not implemented yet. ${hint}`.trim());
    this.name = 'LabTodo';
  }
}

/** Marks a step of an exercise as open. Replace the call with your code. */
export function todo(step: string, hint = ''): never {
  throw new LabTodo(step, hint);
}
