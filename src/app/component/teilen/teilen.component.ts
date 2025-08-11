import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-share',
  imports: [],
  templateUrl: './share.component.html',
})
export class ShareComponent {

  @Input() eventId = ""


  sharePage() {
    const link =  'https://1200-jahre-radolfzell.sybit.education/event/' + this.eventId

    navigator.clipboard.writeText(link)
  }

}
