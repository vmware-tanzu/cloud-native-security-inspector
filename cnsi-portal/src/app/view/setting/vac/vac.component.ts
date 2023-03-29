import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-vac',
  templateUrl: './vac.component.html',
  styleUrls: ['./vac.component.less']
})
export class VacComponent implements OnInit {

  public vacLoading = false
  public vacList = [
    {
      "name": "apache",
      "branch": "2",
      "version": "2.4.55",
      "revision": "44",
      "released_at": "2023-03-03T00:59:52.762Z",
      "last_version_released": "2.4.55",
      "status": "DEPRECATED",
      "deprecation_policy": {
        "deprecation_date": "2022-12-14",
        "grace_period_days": 30,
        "reason": "We will only maintain newest versions of Wordpress",
        "alternative": "Wordpress 7 can be used instead"
      },
      "nonsupport_policy": {
        "name": "Memcached is not supported anymore",
        "reason": "Upstream project has been discontinued."
      }
    }
  ]
  constructor() { }

  ngOnInit(): void {
  }

}
