import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile, NzUploadModule, NzUploadChangeParam } from 'ng-zorro-antd/upload';
import { NzFormModule } from 'ng-zorro-antd/form';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { NzSpinModule } from 'ng-zorro-antd/spin';

export interface CategoryAsset {
  id?: string;
  asset: {
    id: string;
    name: string;
    size?: number;
    extension?: string;
    localPath?: string;
    isDeleted?: boolean;
    createdAt?: string;
    createdBy?: string;
    updatedAt?: string;
    updatedBy?: string;
  };
  type: 'IMAGE' | 'VIDEO';
  isPrimary: boolean;
  url?: string; // URL hiển thị cho người dùng
}

@Component({
  selector: 'app-category-assets',
  templateUrl: './category-assets.component.html',
  styleUrls: ['./category-assets.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NzModalModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzUploadModule,
    NzFormModule,
    FormsModule,
    NzSpinModule
  ]
})
export class CategoryAssetsComponent implements OnInit {
  @Input() initialAsset: CategoryAsset | null = null;
  @Input() required: boolean = false;
  @Output() assetUpdated = new EventEmitter<CategoryAsset | null>();
  @Output() validationChange = new EventEmitter<boolean>();

  categoryAsset: CategoryAsset | null = null;
  
  previewVisible = false;
  previewImage: string = '';
  previewTitle: string = '';

  uploadUrl = `${environment.apiUrl}/api/v1/asset/upload`;
  
  loading = false;
  avatarUrl?: string;
  isValid: boolean = true;
  
  // Thêm các thuộc tính cần thiết
  uploadHeaders = { 'X-Upload-Type': 'category' };
  uploadExtraData = { type: 'CATEGORY' };

  constructor(
    private modalService: NzModalService,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.categoryAsset = this.initialAsset;
    if (this.categoryAsset && this.categoryAsset.url) {
      this.avatarUrl = this.categoryAsset.url;
    } else if (this.categoryAsset && this.categoryAsset.asset?.id) {
      // Nếu có asset id nhưng không có URL, tạo URL từ asset id
      this.avatarUrl = `${environment.cdnBaseUrl}/api/v1/asset/download/${this.categoryAsset.asset.id}`;
    }
    
    // Kiểm tra tính hợp lệ ngay khi khởi tạo
    this.validateAsset();
  }

  beforeUpload = (file: NzUploadFile): boolean | Observable<boolean> => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      this.message.error('Bạn chỉ có thể tải lên file JPG/PNG!');
      return false;
    }
    const isLt2M = (file.size || 0) / 1024 / 1024 < 2;
    if (!isLt2M) {
      this.message.error('Hình ảnh phải nhỏ hơn 2MB!');
      return false;
    }
    this.loading = true;
    return true;
  };

  handleChange(info: NzUploadChangeParam): void {
    if (info.file.status === 'uploading') {
      this.loading = true;
      return;
    }
    if (info.file.status === 'done') {
      const response = info.file.response;
      // Thay đổi cách truy cập dữ liệu từ response
      const asset = response.data;
      const downloadUrl = `${environment.cdnBaseUrl}/api/v1/asset/download/${asset.id}`;
      this.avatarUrl = downloadUrl;
      this.loading = false;
      this.categoryAsset = {
        id: asset.id,
        asset: { 
          id: asset.id,
          name: asset.name,
          size: asset.size,
          extension: asset.extension,
          createdAt: asset.createdAt
        },
        type: 'IMAGE',
        isPrimary: true,
        url: downloadUrl
      };
      // Thêm thông báo để xác nhận avatarUrl đã được cập nhật
      console.log('Avatar URL updated:', this.avatarUrl);
      // Đảm bảo ApplicationRef đã nhận biết thay đổi
      this.cdr.detectChanges();
      // Thông báo asset đã được cập nhật
      this.notifyAssetUpdated();
    } else if (info.file.status === 'error') {
      this.loading = false;
      this.message.error(`${info.file.name} tải lên thất bại.`);
    }
  }

  // Chuyển đổi file thành base64 để preview
  private getBase64(img: File, callback: (img: string) => void): void {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result!.toString()));
    reader.readAsDataURL(img);
  }

  // Chức năng xóa asset
  removeAsset(): void {
    this.modalService.confirm({
      nzTitle: 'Bạn có chắc chắn muốn xóa hình ảnh này?',
      nzContent: 'Hình ảnh sẽ bị xóa khỏi danh mục.',
      nzOkText: 'Đồng ý',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.categoryAsset = null;
        this.avatarUrl = undefined;
        this.notifyAssetUpdated();
        this.message.success('Đã xóa hình ảnh thành công.');
      },
      nzCancelText: 'Hủy'
    });
  }

  // Chức năng xem trước
  showPreviewImage(): void {
    if (!this.avatarUrl) return;
    
    this.previewImage = this.avatarUrl;
    this.previewTitle = this.categoryAsset?.asset.name || 'Hình ảnh danh mục';
    this.previewVisible = true;
  }

  // Chức năng xóa ảnh
  removeImage(): void {
    this.modalService.confirm({
      nzTitle: 'Bạn có chắc chắn muốn xóa hình ảnh này?',
      nzContent: 'Hình ảnh sẽ bị xóa khỏi danh mục.',
      nzOkText: 'Đồng ý',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.categoryAsset = null;
        this.avatarUrl = undefined;
        this.notifyAssetUpdated();
        this.message.success('Đã xóa hình ảnh thành công.');
      },
      nzCancelText: 'Hủy'
    });
  }

  // Thông báo cập nhật asset
  private notifyAssetUpdated(): void {
    this.assetUpdated.emit(this.categoryAsset);
    this.validateAsset();
  }

  // Kiểm tra tính hợp lệ của asset
  private validateAsset(): void {
    const valid = !this.required || (this.categoryAsset !== null);
    this.isValid = valid;
    this.validationChange.emit(valid);
  }

  // Hàm kiểm tra trạng thái hợp lệ của asset để component cha có thể truy cập
  public validate(): boolean {
    this.validateAsset();
    return this.isValid;
  }
} 