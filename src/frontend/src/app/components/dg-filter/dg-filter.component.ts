import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ClrDatagridFilterInterface } from '@clr/angular';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PolicyService } from 'src/app/service/policy.service'
import { ShardService } from 'src/app/service/shard.service';
@Component({
  selector: 'app-dg-filter',
  templateUrl: './dg-filter.component.html',
  styleUrls: ['./dg-filter.component.less']
})
export class DgFilterComponent
  implements ClrDatagridFilterInterface<any>, OnInit
  {
      @Input() dataSource: any[] = [];
      @Input() label: any;
      @Input() continues: string = '';
      @Input() pageSize: number = 10;
      @ViewChild('filterInput', { static: true }) filterInputRef!: ElementRef;
  
      selectedLabels: Map<number, boolean> = new Map<number, boolean>();
  
      changes: EventEmitter<any> = new EventEmitter<any>(false);
  
      labelFilter = '';
  
      ngOnInit(): void {
          fromEvent(this.filterInputRef.nativeElement, 'keyup')
              .pipe(debounceTime(500))
              .subscribe(() => {
                  let hnd = setInterval(() => this.cdr.markForCheck(), 100);
                  setTimeout(() => clearInterval(hnd), 2000);
              });
              // setInterval(() => console.log(111, this.labelFilter), 1000)
      }
      constructor(private cdr: ChangeDetectorRef, private policyService:PolicyService, private shardService:ShardService) {}
  
      labelFilterInput () {

      }

      get filteredLabels() {
          return this.dataSource.filter((label: any) =>
              label.name.includes(this.labelFilter)
          );
      }
  
      isActive(): boolean {
          return this.selectedLabels.size > 0;
      }
  
      accepts(cv: any): boolean {
          // if (this.resourceType === ResourceType.CHART_VERSION) {
          //     return (cv as HelmChartVersion).labels.some(label =>
          //         this.selectedLabels.get(label.id)
          //     );
          // } else if (this.resourceType === ResourceType.REPOSITORY_TAG) {
          //     return (cv as Artifact).labels.some(label =>
          //         this.selectedLabels.get(label.id)
          //     );
          // } else {
          //     return true;
          // }
          console.log('cv', cv);
          return true
          
      }
  
      selectLabel(label: any) {
          this.selectedLabels.set(label.id, true);
          this.changes.emit();
      }
  
      unselectLabel(label: any) {
          this.selectedLabels.delete(label.id);
          this.changes.emit(true);
      }
  
      isSelected(label: any) {
          return this.selectedLabels.has(label.id);
      }

      search() {
          console.log(this.labelFilter);
          this.policyService.getNamespaceAssessmentreports(this.labelFilter, this.pageSize, '').subscribe(
              data => {
                this.shardService.reportslist = data.items
              }
          )
      }
  }
