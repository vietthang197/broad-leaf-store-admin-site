import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NzBreadCrumbComponent, NzBreadCrumbItemComponent} from 'ng-zorro-antd/breadcrumb';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {NzFormDirective} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {NzDatePickerComponent} from 'ng-zorro-antd/date-picker';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTableComponent, NzTdAddOnComponent, NzThMeasureDirective, NzThSelectionComponent} from 'ng-zorro-antd/table';
import {NzBadgeComponent} from 'ng-zorro-antd/badge';
import {NzDividerComponent} from 'ng-zorro-antd/divider';
import {NgClass, NgForOf} from '@angular/common';
import {NzMessageService} from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { Router } from '@angular/router';

interface DataItem {
  id: string;
  ruleName: string;
  description: string;
  serviceCalls: number;
  status: 'running' | 'default';
  lastScheduled: string;
}

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  imports: [
    NzBreadCrumbComponent,
    NzBreadCrumbItemComponent,
    NzCardComponent,
    NzFormDirective,
    NzRowDirective,
    NzColDirective,
    ReactiveFormsModule,
    NzInputDirective,
    NzSelectComponent,
    NzOptionComponent,
    NzDatePickerComponent,
    NzButtonComponent,
    NzIconDirective,
    NzTableComponent,
    NzThSelectionComponent,
    NzTdAddOnComponent,
    NzBadgeComponent,
    NzDividerComponent,
    NgForOf,
    NzThMeasureDirective,
    NgClass,
    NzModalModule
  ],
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  searchForm!: FormGroup;
  isCollapsed = false;
  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<string>();

  listOfData: DataItem[] = [];

  isAddProductModalVisible = false;
  addProductTypeForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private router: Router
  
  ) {}

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      ruleName: [null],
      description: [null],
      serviceCalls: [null],
      status: [null],
      lastScheduled: [null]
    });

    this.addProductTypeForm = this.fb.group({
      productType: [null, [Validators.required]]
    });

    this.listOfData = Array.from({ length: 100 }).map((_, i) => ({
      id: `${i}`,
      ruleName: `Rule name ${i}`,
      description: `This is description ${i}`,
      serviceCalls: Math.floor(Math.random() * 100),
      status: Math.random() > 0.5 ? 'running' : 'default',
      lastScheduled: `2023-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`
    }));
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  search(): void {
    console.log('Search with:', this.searchForm.value);
    // Thêm logic tìm kiếm thực tế ở đây
  }

  reset(): void {
    this.searchForm.reset();
  }

  onAllChecked(checked: boolean): void {
    this.listOfData.forEach(item => this.updateCheckedSet(item.id, checked));
    this.refreshCheckedStatus();
  }

  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  refreshCheckedStatus(): void {
    const listOfEnabledData = this.listOfData;
    this.checked = listOfEnabledData.every(item => this.setOfCheckedId.has(item.id));
    this.indeterminate = listOfEnabledData.some(item => this.setOfCheckedId.has(item.id)) && !this.checked;
  }

  showAddProductModal(): void {
    this.isAddProductModalVisible = true;
  }

  handleCancel(): void {
    this.isAddProductModalVisible = false;
    this.addProductTypeForm.reset();
  }

  submitChooseProductType(): void {
    if (this.addProductTypeForm.valid) {
      const productType = this.addProductTypeForm.get('productType')?.value;
      switch(productType){
        case 'SIMPLE':
          this.router.navigate(['/create-product/simple']);
          this.handleCancel();
          break;
        case 'VARIANT':
          this.handleCancel();
          break;
        case 'GROUPED':
          this.handleCancel();
          break;
        case 'EXTERNAL':
          this.handleCancel();
          break;
      }
    } else {
      Object.values(this.addProductTypeForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
