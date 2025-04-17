import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NzBreadCrumbComponent, NzBreadCrumbItemComponent} from 'ng-zorro-antd/breadcrumb';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {NzFormDirective} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTableComponent, NzTdAddOnComponent, NzThMeasureDirective, NzThSelectionComponent} from 'ng-zorro-antd/table';
import {NzBadgeComponent} from 'ng-zorro-antd/badge';
import {NzDividerComponent} from 'ng-zorro-antd/divider';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {NzMessageService} from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { Title } from '@angular/platform-browser';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentCategoryId: string | null;
  parentCategory?: Category;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
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
    NzButtonComponent,
    NzIconDirective,
    NzTableComponent,
    NzThSelectionComponent,
    NzTdAddOnComponent,
    NzDividerComponent,
    NgForOf,
    NzThMeasureDirective,
    NgClass,
    NzModalModule,
    NzPopconfirmModule
  ],
  styleUrls: ['./categories.component.scss'],
  standalone: true
})
export class CategoriesComponent implements OnInit {
  searchForm!: FormGroup;
  isCollapsed = false;
  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<string>();

  listOfData: Category[] = [];
  categories: Category[] = [];
  isLoading = false;
  pageIndex = 1;
  pageSize = 10;
  total = 0;

  isAddCategoryModalVisible = false;
  addCategoryForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    public router: Router,
    private categoryService: CategoryService,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Danh sách danh mục');
    this.searchForm = this.fb.group({
      name: [null],
      slug: [null],
      parentCategoryId: [null]
    });

    this.addCategoryForm = this.fb.group({
      name: [null, [Validators.required]],
      description: [null],
      parentCategoryId: [null]
    });

    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    const params = {
      ...this.searchForm.value,
      page: this.pageIndex - 1,
      size: this.pageSize
    };

    this.categoryService.getCategories(params).subscribe({
      next: (response) => {
        this.listOfData = response.content || response;
        this.total = response.totalElements || response.length;
        this.categories = response.content || response;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.message.error('Không thể tải danh sách danh mục: ' + error.message);
      }
    });
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.loadCategories();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
    this.loadCategories();
  }

  search(): void {
    this.pageIndex = 1;
    this.loadCategories();
  }

  reset(): void {
    this.searchForm.reset();
    this.pageIndex = 1;
    this.loadCategories();
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

  showAddCategoryModal(): void {
    this.isAddCategoryModalVisible = true;
  }

  handleCancel(): void {
    this.isAddCategoryModalVisible = false;
    this.addCategoryForm.reset();
  }

  submitAddCategory(): void {
    if (this.addCategoryForm.valid) {
      this.isLoading = true;
      const categoryData = this.addCategoryForm.value;
      
      this.categoryService.createCategory(categoryData).subscribe({
        next: () => {
          this.message.success('Thêm danh mục thành công!');
          this.handleCancel();
          this.loadCategories();
        },
        error: (error) => {
          this.isLoading = false;
          this.message.error('Thêm danh mục thất bại: ' + error.message);
        }
      });
    } else {
      Object.values(this.addCategoryForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  }

  deleteCategory(id: string): void {
    this.isLoading = true;
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.message.success('Xóa danh mục thành công!');
        this.loadCategories();
      },
      error: (error) => {
        this.isLoading = false;
        this.message.error('Xóa danh mục thất bại: ' + error.message);
      }
    });
  }

  getParentCategoryName(category: Category): string {
    return category.parentCategory ? category.parentCategory.name : 'N/A';
  }
} 