import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-teilen',
  imports: [],
  templateUrl: './teilen.component.html',
})
export class TeilenComponent {

  @Input() eventId = ""


  sharePage() {
    const link =  'https://1200-jahre-radolfzell.sybit.education/event/' + this.eventId

    navigator.clipboard.writeText(link)
  }

}
