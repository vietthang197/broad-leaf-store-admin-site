import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { QuillModule } from 'ngx-quill';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../services/category.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
import { CategoryAssetsComponent, CategoryAsset } from '../../shared/components/category-assets/category-assets.component';

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
  selector: 'app-create-category',
  templateUrl: './create-category.component.html',
  styleUrls: ['./create-category.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzToolTipModule,
    NzGridModule,
    QuillModule,
    CategoryAssetsComponent
  ]
})
export class CreateCategoryComponent implements OnInit {
  categoryForm!: FormGroup;
  categories: Category[] = [];
  
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

  categoryAsset: CategoryAsset | null = null;
  isSubmitting = false;
  
  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private message: NzMessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: [null, [Validators.required]],
      slug: [null, [Validators.required]],
      parentCategoryId: [null],
      description: [null]
    });
    
    // Load danh sách danh mục
    this.loadCategories();
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

  submitForm(): void {
    if (this.categoryForm.invalid) {
      // Đánh dấu tất cả các trường là đã chạm vào để hiển thị lỗi
      Object.values(this.categoryForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.error('Vui lòng điền đầy đủ thông tin danh mục!');
      return;
    }

    this.isSubmitting = true;
    
    // Chuẩn bị dữ liệu danh mục
    const formValue = this.categoryForm.value;
    
    // Chuẩn bị asset data
    let assetData = null;
    if (this.categoryAsset && this.categoryAsset.asset) {
      assetData = {
        id: this.categoryAsset.asset.id
      };
    }
    
    const categoryData = {
      name: formValue.name,
      slug: formValue.slug,
      parentCategoryId: formValue.parentCategoryId || null,
      description: formValue.description,
      asset: assetData
    };
    
    console.log('Sending category data:', categoryData);
    
    // Gọi API tạo danh mục
    this.categoryService.createCategory(categoryData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.message.success('Tạo danh mục thành công!');
        // Điều hướng đến trang danh sách danh mục
        this.router.navigate(['/categories']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.message.error('Tạo danh mục thất bại: ' + (error.error?.message || 'Lỗi không xác định'));
        console.error('Error creating category:', error);
      }
    });
  }
  
  onAssetUpdated(asset: CategoryAsset | null): void {
    this.categoryAsset = asset;
    console.log('Asset updated:', asset);
  }
} 