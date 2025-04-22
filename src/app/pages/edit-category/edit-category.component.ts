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
import { Router, ActivatedRoute } from '@angular/router';
import { CategoryAssetsComponent, CategoryAsset } from '../../shared/components/category-assets/category-assets.component';
import { Title } from '@angular/platform-browser';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NzSpinModule } from 'ng-zorro-antd/spin';
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentCategoryId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  asset?: any;
}

@Component({
  selector: 'app-edit-category',
  templateUrl: './edit-category.component.html',
  styleUrls: ['./edit-category.component.scss'],
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
    CategoryAssetsComponent,
    NzSpinModule
  ]
})
export class EditCategoryComponent implements OnInit {
  categoryForm!: FormGroup;
  categories: Category[] = [];
  categoryId: string = '';
  originalCategory: Category | null = null;
  
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
  isLoading = true;
  
  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private message: NzMessageService,
    public router: Router,
    private route: ActivatedRoute,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Chỉnh sửa danh mục');
    
    this.categoryForm = this.fb.group({
      name: [null, [Validators.required]],
      slug: [null, [Validators.required]],
      parentCategoryId: [null],
      description: [null]
    });
    
    // Lấy ID từ route và load dữ liệu danh mục
    this.route.params.subscribe(params => {
      this.categoryId = params['id'];
      if (this.categoryId) {
        this.loadCategoryDetails();
      } else {
        this.router.navigate(['/categories']);
        this.message.error('Không tìm thấy mã danh mục!');
      }
    });
    
    // Load danh sách danh mục
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        // Lọc danh mục hiện tại ra khỏi danh sách danh mục cha để tránh chọn chính nó làm cha
        this.categories = data.filter((category: Category) => category.id !== this.categoryId);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadCategoryDetails(): void {
    this.isLoading = true;
    this.categoryService.getCategory(this.categoryId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (category) => {
          this.originalCategory = category;
          // Cập nhật form với dữ liệu từ API
          this.categoryForm.patchValue({
            name: category.name,
            slug: category.slug,
            parentCategoryId: category.parentCategoryId,
            description: category.description
          });
          
          // Nếu có asset, cập nhật categoryAsset
          if (category.asset) {
            const assetData = category.asset;
            this.categoryAsset = {
              id: assetData.id,
              asset: {
                id: assetData.id,
                name: assetData.name || '',
                size: assetData.size,
                extension: assetData.extension,
                createdAt: assetData.createdAt
              },
              type: 'IMAGE',
              isPrimary: true,
              url: `${environment.cdnBaseUrl}/api/v1/asset/download/${assetData.id}`
            };
          }
        },
        error: (error) => {
          this.message.error('Không thể tải thông tin danh mục: ' + error.message);
          this.router.navigate(['/categories']);
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
    
    console.log('Sending updated category data:', categoryData);
    
    // Gọi API cập nhật danh mục
    this.categoryService.updateCategory(this.categoryId, categoryData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.message.success('Cập nhật danh mục thành công!');
        // Điều hướng đến trang danh sách danh mục
        this.router.navigate(['/categories']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.message.error('Cập nhật danh mục thất bại: ' + (error.error?.message || 'Lỗi không xác định'));
        console.error('Error updating category:', error);
      }
    });
  }
  
  onAssetUpdated(asset: CategoryAsset | null): void {
    this.categoryAsset = asset;
    console.log('Asset updated:', asset);
  }
} 