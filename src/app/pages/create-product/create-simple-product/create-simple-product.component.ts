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
import { AssetMeta } from '../../../shared/components/product-assets/product-assets.component';

interface CustomAttribute {
  name: string;
  value: string;
  label?: string;
  supportMultipleValues: boolean;
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

  productAssets: AssetMeta[] = [];
  
  constructor(private fb: FormBuilder) {}

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
      costCurrency: [null, [Validators.required]]
    });

    this.initAttributeForm();
    
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
    if (this.productForm.valid) {
      console.log('Form submitted:', this.productForm.value);
      // Xử lý logic gửi form
    } else {
      // Đánh dấu tất cả các trường là đã chạm vào để hiển thị lỗi
      Object.values(this.productForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  loadProductAssets(): void {
    // Giả lập API call để lấy assets của sản phẩm
    // Trong thực tế, bạn sẽ gọi API service
    setTimeout(() => {
      this.productAssets = [
        {
          id: 'primary_123',
          url: 'http://localhost:8888/assets/primary_123',
          isPrimary: true,
          type: 'IMAGE',
          title: 'Primary Product Image',
          altText: 'Product main view',
          tags: ['main', 'featured']
        },
        {
          id: 'additional_456',
          url: 'http://localhost:8888/assets/additional_456',
          isPrimary: false,
          type: 'IMAGE',
          title: 'Side view',
          altText: 'Product side view',
          tags: ['side']
        }
        // Thêm các assets khác nếu cần
      ];
    }, 1000);
  }
  
  onAssetsUpdated(assets: AssetMeta[]): void {
    this.productAssets = assets;
    
    // Cập nhật form value nếu cần
    const primaryAsset = assets.find(a => a.isPrimary);
    if (primaryAsset) {
      // Ví dụ: cập nhật một trường trong form chính
      // this.productForm.patchValue({
      //   primaryImageUrl: primaryAsset.url
      // });
    }
    
    // Có thể lưu tạm thời hoặc gửi lên server
    console.log('Assets updated:', assets);
  }
}
