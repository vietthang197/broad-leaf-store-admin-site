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
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { environment } from '../../../environments/environment';

interface Product {
  id: string;
  name: string;
  category: {
    name: string;
  };
  salePrice: {
    amount: number;
    currency: string;
  };
  regularPrice: {
    amount: number;
    currency: string;
  };
  cost: {
    amount: number;
    currency: string;
  };
  quantity: number;
  availableOnline: boolean;
  sku: string;
  primaryAsset: {
    asset: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentCategoryId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
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
    NzButtonComponent,
    NzIconDirective,
    NzTableComponent,
    NzThSelectionComponent,
    NzTdAddOnComponent,
    NzBadgeComponent,
    NzDividerComponent,
    NgForOf,
    NgIf,
    NzThMeasureDirective,
    NgClass,
    NzModalModule,
    NzPopconfirmModule
  ],
  styleUrls: ['./products.component.scss'],
  standalone: true
})
export class ProductsComponent implements OnInit {
  searchForm!: FormGroup;
  isCollapsed = false;
  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<string>();

  listOfData: Product[] = [];
  categories: Category[] = [];
  isLoading = false;
  pageIndex = 1;
  pageSize = 10;
  total = 0;

  isAddProductModalVisible = false;
  addProductTypeForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    public router: Router,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      name: [null],
      sku: [null],
      category: [null],
      availableOnline: [null]
    });

    this.addProductTypeForm = this.fb.group({
      productType: [null, [Validators.required]]
    });

    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    const params = {
      ...this.searchForm.value,
      page: this.pageIndex - 1,
      size: this.pageSize
    };

    this.productService.getProducts(params).subscribe({
      next: (response) => {
        this.listOfData = response.content;
        this.total = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.message.error('Không thể tải danh sách sản phẩm: ' + error.message);
      }
    });
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.loadProducts();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
    this.loadProducts();
  }

  search(): void {
    this.pageIndex = 1;
    this.loadProducts();
  }

  reset(): void {
    this.searchForm.reset();
    this.pageIndex = 1;
    this.loadProducts();
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

  formatPrice(price: { amount: number, currency: string }): string {
    return `${price.amount.toLocaleString()} ${price.currency}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  }

  deleteProduct(id: string): void {
    this.isLoading = true;
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.message.success('Xóa sản phẩm thành công!');
        this.loadProducts();
      },
      error: (error) => {
        this.isLoading = false;
        this.message.error('Xóa sản phẩm thất bại: ' + error.message);
      }
    });
  }
  
  getAssetUrl(asset: any): string {
    if (!asset || !asset.asset || !asset.asset.id) {
      return 'assets/images/no-image.png';
    }
    return `${environment.cdnBaseUrl}/api/v1/asset/download/${asset.asset.id}`;
  }
}
