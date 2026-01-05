import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-invitation-form',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, MessageModule],
  templateUrl: './invitation-form.html',
  host: {
    class: 'flex-1 overflow-y-auto px-4 md:px-6 lg:px-12 sm:pt-6',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InvitationForm {
  readonly #fb = inject(FormBuilder);
  emails = input.required<string[]>();

  addForm = this.#fb.nonNullable.group({
    email: this.#fb.nonNullable.control('', [Validators.email]),
  });

  onAddEmail = output<string>();
  onRemoveEmail = output<string>();

  addEmail() {
    if (this.addForm.valid && this.addForm.value.email) {
      this.onAddEmail.emit(this.addForm.value.email);
      this.addForm.reset();
    }
  }
}
