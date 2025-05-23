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
import { Router } from '@angular/router';
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
  selector: 'app-create-simple-product',
  templateUrl: './create-simple-product.component.html',
  styleUrls: ['./create-simple-product.component.scss'],
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
    ProductAssetsComponent
  ]
})
export class CreateSimpleProductComponent implements OnInit {
  productForm!: FormGroup;
  attributeForm!: FormGroup;
  customAttributes: CustomAttribute[] = [];
  isAttributeModalVisible = false;
  isAttributeModalLoading = false;
  isEditMode = false;
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
  }]

  productPrimaryAsset: ProductAsset | null = null;
  productAdditionalAssets: ProductAsset[] = [];
  isSubmitting = false;
  
  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private productService: ProductService,
    private message: NzMessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productForm = this.fb.group({
      productType: ['SIMPLE', Validators.required],
      name: [null, [Validators.required]],
      sku: [null, [Validators.required]],
      slug: [null, [Validators.required]],
      category: [null, [Validators.required]],
      availableOnline: ['true', [Validators.required]],
      description: [null, [Validators.required]],
      regularPriceAmount: [null, [Validators.required]],
      regularPriceCurrency: [null, [Validators.required]],
      salePriceAmount: [null, [Validators.required]],
      salePriceCurrency: [null, [Validators.required]],
      costAmount: [null, [Validators.required]],
      costCurrency: [null, [Validators.required]],
      quantity: [0, [Validators.required, Validators.min(0)]]
    });

    this.initAttributeForm();
    
    // Load danh sách danh mục
    this.loadCategories();
    
    // Nếu đang chỉnh sửa sản phẩm, load assets từ API
    if (this.isEditMode) {
      this.loadProductAssets();
    }
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

    this.isSubmitting = true;
    
    // Chuẩn bị dữ liệu sản phẩm
    const formValue = this.productForm.value;
    
    // Chuẩn bị dữ liệu sản phẩm theo cấu trúc API mới
    const productData = {
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
    
    // Gọi API tạo sản phẩm
    this.productService.createProduct(productData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.message.success('Tạo sản phẩm thành công!');
        // Điều hướng đến trang danh sách sản phẩm hoặc trang chi tiết sản phẩm
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.message.error('Tạo sản phẩm thất bại: ' + (error.error?.message || 'Lỗi không xác định'));
        console.error('Error creating product:', error);
      }
    });
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  loadProductAssets(): void {
    // Giả lập API call để lấy assets của sản phẩm
    // Trong thực tế, bạn sẽ gọi API service
    setTimeout(() => {
      const assetId = 'primary_123';
      
      this.productPrimaryAsset = {
        id: 'primary_asset_123',
        asset: {
          id: assetId,
          name: 'Primary Product Image',
          size: 100000,
          extension: 'jpg',
          localPath: '',
          isDeleted: false,
          createdAt: new Date().toISOString(),
          createdBy: '',
          updatedAt: '',
          updatedBy: ''
        },
        type: 'IMAGE',
        isPrimary: true,
        altText: 'Product main view',
        tags: ['main', 'featured'],
        url: `${environment.cdnBaseUrl}/api/v1/asset/download/${assetId}`
      };
      
      const additionalAssetId = 'additional_456';
      this.productAdditionalAssets = [
        {
          id: 'additional_asset_456',
          asset: {
            id: additionalAssetId,
            name: 'Side view',
            size: 80000,
            extension: 'jpg',
            localPath: '',
            isDeleted: false,
            createdAt: new Date().toISOString(),
            createdBy: '',
            updatedAt: '',
            updatedBy: ''
          },
          type: 'IMAGE',
          isPrimary: false,
          altText: 'Product side view',
          tags: ['side'],
          url: `${environment.cdnBaseUrl}/api/v1/asset/download/${additionalAssetId}`
        }
      ];
    }, 1000);
  }
  
  onAssetsUpdated(assets: ProductAssets): void {
    this.productPrimaryAsset = assets.primaryAsset;
    this.productAdditionalAssets = assets.additionalAssets;
    
    console.log('Assets updated:', assets);
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
