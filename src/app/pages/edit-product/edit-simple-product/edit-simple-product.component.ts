import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { QuillModule } from 'ngx-quill';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCascaderModule } from 'ng-zorro-antd/cascader';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CommonModule } from '@angular/common';
import { ProductAssetsComponent } from '../../../shared/components/product-assets/product-assets.component';
import { ProductAsset, ProductAssets } from '../../../shared/components/product-assets/product-assets.component';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router, ActivatedRoute } from '@angular/router';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { environment } from '../../../../environments/environment';

interface CustomAttribute {
  name: string;
  value: string;
  label?: string;
  supportMultipleValues: boolean;
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
  selector: 'app-edit-simple-product',
  templateUrl: './edit-simple-product.component.html',
  styleUrls: ['./edit-simple-product.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzRadioModule,
    NzIconModule,
    NzToolTipModule,
    NzGridModule,
    QuillModule,
    NzInputNumberModule,
    NzCascaderModule,
    NzModalModule,
    NzTableModule,
    NzTagModule,
    NzSpinModule,
    ProductAssetsComponent
  ]
})
export class EditSimpleProductComponent implements OnInit {
  productForm!: FormGroup;
  attributeForm!: FormGroup;
  customAttributes: CustomAttribute[] = [];
  isAttributeModalVisible = false;
  isAttributeModalLoading = false;
  categories: Category[] = [];
  formatterDollar = (value: number): string => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  parserDollar = (value: string): number => parseFloat(value?.replace(/\$\s?|(,*)/g, ''));
  
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image', 'video']
    ]
  };

  currencyList = [{
    label: 'VND',
    value: 'VND'
  }];

  productPrimaryAsset: ProductAsset | null = null;
  productAdditionalAssets: ProductAsset[] = [];
  isSubmitting = false;
  isLoading = true;
  productId: string = '';
  
  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private productService: ProductService,
    private message: NzMessageService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadCategories();
    
    // Lấy ID sản phẩm từ URL
    this.route.params.subscribe(params => {
      this.productId = params['id'];
      if (this.productId) {
        this.loadProductData();
      } else {
        this.message.error('Không tìm thấy ID sản phẩm!');
        this.router.navigate(['/products']);
      }
    });
  }

  private initForms(): void {
    this.productForm = this.fb.group({
      productType: ['SIMPLE', Validators.required],
      name: [null, [Validators.required]],
      sku: [null, [Validators.required]],
      slug: [null, [Validators.required]],
      category: [null, [Validators.required]],
      availableOnline: ['true', [Validators.required]],
      description: [null, [Validators.required]],
      regularPriceAmount: [null, [Validators.required]],
      regularPriceCurrency: ['VND', [Validators.required]],
      salePriceAmount: [null, [Validators.required]],
      salePriceCurrency: ['VND', [Validators.required]],
      costAmount: [null, [Validators.required]],
      costCurrency: ['VND', [Validators.required]],
      quantity: [0, [Validators.required, Validators.min(0)]]
    });

    this.initAttributeForm();
  }

  private initAttributeForm(): void {
    this.attributeForm = this.fb.group({
      name: [null, [Validators.required]],
      supportMultipleValues: [false],
      value: [null],
      multipleValues: [[]],
      label: [null]
    });
  }

  loadProductData(): void {
    this.isLoading = true;
    this.productService.getProduct(this.productId).subscribe({
      next: (product) => {
        // Sản phẩm trả về là một mảng có 1 phần tử
        if (Array.isArray(product) && product.length > 0) {
          product = product[0]; // Lấy phần tử đầu tiên
        }
        
        // Cập nhật form
        this.productForm.patchValue({
          productType: product.productType,
          name: product.name,
          sku: product.sku,
          slug: product.slug,
          category: product.category?.id,
          availableOnline: product.availableOnline ? 'true' : 'false',
          description: product.description,
          regularPriceAmount: product.regularPrice?.amount,
          regularPriceCurrency: product.regularPrice?.currency,
          salePriceAmount: product.salePrice?.amount,
          salePriceCurrency: product.salePrice?.currency,
          costAmount: product.cost?.amount,
          costCurrency: product.cost?.currency,
          quantity: product.quantity || 0
        });
        
        // Cập nhật attributes
        this.customAttributes = product.attributes?.map((attr: any) => ({
          name: attr.name,
          value: attr.value,
          label: attr.label,
          supportMultipleValues: Array.isArray(attr.value)
        })) || [];
        
        // Cập nhật assets
        if (product.primaryAsset) {
          // Tạo URL cho ảnh
          const assetUrl = `${environment.cdnBaseUrl}/api/v1/asset/download/${product.primaryAsset.asset.id}`;
          
          this.productPrimaryAsset = {
            id: product.primaryAsset.id,
            asset: product.primaryAsset.asset,
            type: product.primaryAsset.type,
            isPrimary: true,
            altText: product.primaryAsset.altText || '',
            tags: product.primaryAsset.tags || [],
            url: assetUrl
          };
        }
        
        if (product.additionalAssets && product.additionalAssets.length > 0) {
          this.productAdditionalAssets = product.additionalAssets.map((assetData: any) => {
            // Tạo URL cho ảnh
            const assetUrl = `${environment.cdnBaseUrl}/api/v1/asset/download/${assetData.asset.id}`;
            
            return {
              id: assetData.id,
              asset: assetData.asset,
              type: assetData.type,
              isPrimary: false,
              altText: assetData.altText || '',
              tags: assetData.tags || [],
              url: assetUrl
            };
          });
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.message.error('Không thể tải thông tin sản phẩm: ' + error.message);
        console.error('Error loading product:', error);
      }
    });
  }

  showCreateAttributeModal(): void {
    this.isAttributeModalVisible = true;
  }

  handleAttributeModalCancel(): void {
    this.isAttributeModalVisible = false;
    this.attributeForm.reset({
      supportMultipleValues: false
    });
  }

  handleAttributeModalSubmit(): void {
    if (this.attributeForm.invalid) {
      // Đánh dấu tất cả các trường là đã chạm vào để hiển thị lỗi
      Object.values(this.attributeForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity();
        }
      });
      return;
    }

    this.isAttributeModalLoading = true;

    const formValue = this.attributeForm.value;
    const isMultiple = formValue.supportMultipleValues;
    
    const newAttribute: CustomAttribute = {
      name: formValue.name,
      value: isMultiple ? formValue.multipleValues : formValue.value,
      label: formValue.label,
      supportMultipleValues: isMultiple
    };

    this.customAttributes = [...this.customAttributes, newAttribute];
    
    setTimeout(() => {
      this.isAttributeModalLoading = false;
      this.isAttributeModalVisible = false;
      this.attributeForm.reset({
        supportMultipleValues: false
      });
    }, 500);
  }

  deleteAttribute(index: number): void {
    this.customAttributes = this.customAttributes.filter((_, i) => i !== index);
  }

  submitForm(): void {
    if (this.productForm.invalid) {
      // Đánh dấu tất cả các trường là đã chạm vào để hiển thị lỗi
      Object.values(this.productForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.error('Vui lòng điền đầy đủ thông tin sản phẩm!');
      return;
    }

    // Kiểm tra primary asset
    if (!this.productPrimaryAsset) {
      this.message.error('Vui lòng chọn ít nhất một hình ảnh chính cho sản phẩm!');
      return;
    }

    this.isLoading = true;
    this.isSubmitting = true;
    
    // Chuẩn bị dữ liệu sản phẩm
    const formValue = this.productForm.value;
    
    // Chuẩn bị dữ liệu sản phẩm theo cấu trúc API mới
    const productData = {
      id: this.productId,
      productType: formValue.productType,
      name: formValue.name,
      sku: formValue.sku,
      slug: formValue.slug,
      category: formValue.category,
      availableOnline: formValue.availableOnline === 'true',
      description: formValue.description,
      attributes: this.customAttributes,
      quantity: formValue.quantity,
      primaryAsset: {
        id: this.productPrimaryAsset.id,
        asset: this.productPrimaryAsset.asset,
        type: this.productPrimaryAsset.type,
        isPrimary: true,
        altText: this.productPrimaryAsset.altText,
        tags: this.productPrimaryAsset.tags
      },
      additionalAssets: this.productAdditionalAssets.map(asset => ({
        id: asset.id,
        asset: asset.asset,
        type: asset.type,
        isPrimary: false,
        altText: asset.altText,
        tags: asset.tags
      })),
      cost: {
        amount: formValue.costAmount,
        currency: formValue.costCurrency
      },
      regularPrice: {
        amount: formValue.regularPriceAmount,
        currency: formValue.regularPriceCurrency
      },
      salePrice: {
        amount: formValue.salePriceAmount,
        currency: formValue.salePriceCurrency
      }
    };
    
    // Gọi API cập nhật sản phẩm
    this.productService.updateProduct(this.productId, productData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isSubmitting = false;
        this.message.success('Cập nhật sản phẩm thành công!');
        // Điều hướng đến trang danh sách sản phẩm
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.isLoading = false;
        this.isSubmitting = false;
        this.message.error('Cập nhật sản phẩm thất bại: ' + (error.error?.message || 'Lỗi không xác định'));
        console.error('Error updating product:', error);
      }
    });
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }
  
  onAssetsUpdated(assets: ProductAssets): void {
    this.productPrimaryAsset = assets.primaryAsset;
    this.productAdditionalAssets = assets.additionalAssets;
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
} 