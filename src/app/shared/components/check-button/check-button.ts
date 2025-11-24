import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-check-button',
  imports: [ ButtonModule ],
  templateUrl: './check-button.html',
})
export class CheckButton {

  onClick() {
    alert('Button clicked!');
  }
}
