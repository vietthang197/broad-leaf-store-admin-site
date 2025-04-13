import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzUploadFile, NzUploadChangeParam, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { environment } from '../../../../environments/environment';
import { AssetService } from '../../../services/asset.service';
import { Observable } from 'rxjs';

export interface AssetMeta {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  title?: string;
  altText?: string;
  tags?: string[];
  file?: File;
  isPrimary?: boolean;
}

export interface ProductAssets {
  primaryAsset: AssetMeta | null;
  additionalAssets: AssetMeta[];
}

@Component({
  selector: 'app-product-assets',
  templateUrl: './product-assets.component.html',
  styleUrls: ['./product-assets.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    NzCardModule,
    NzUploadModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzInputModule,
    NzTagModule,
    NzSelectModule,
    NzSpinModule,
    NzMessageModule,
    NzToolTipModule,
    NzCheckboxModule,
    NzModalModule,
  ]
})
export class ProductAssetsComponent implements OnChanges {
  @Input() initialPrimaryAsset: AssetMeta | null = null;
  @Input() initialAdditionalAssets: AssetMeta[] = [];
  @Output() assetsUpdated = new EventEmitter<ProductAssets>();

  // Properties for picture wall
  uploadUrl = ''; // Chỉ để đáp ứng yêu cầu của ng-zorro, thực tế upload sẽ xử lý qua beforeUpload
  primaryFileList: NzUploadFile[] = [];
  additionalFileList: NzUploadFile[] = [];
  previewVisible = false;
  previewImage = '';
  isImagePreview = true; // Mặc định là xem ảnh

  // Original properties
  primaryAsset: AssetMeta | null = null;
  additionalAssets: AssetMeta[] = [];
  selectedAsset: AssetMeta | null = null;
  isMetadataPanelVisible = false;
  isUploading = false;
  isUploadingMultiple = false;
  searchText = '';
  metadataForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private assetService: AssetService
  ) {
    this.metadataForm = this.fb.group({
      title: [''],
      altText: [''],
      tags: [[]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialPrimaryAsset'] && this.initialPrimaryAsset) {
      this.primaryAsset = this.initialPrimaryAsset;
      this.updatePrimaryFileList();
    }
    
    if (changes['initialAdditionalAssets'] && this.initialAdditionalAssets) {
      this.additionalAssets = [...this.initialAdditionalAssets];
      this.updateAdditionalFileList();
    }
  }

  // Convert AssetMeta to NzUploadFile
  private assetMetaToNzUploadFile(asset: AssetMeta): NzUploadFile {
    return {
      uid: asset.id,
      name: asset.title || 'image',
      status: 'done',
      url: asset.url,
      thumbUrl: asset.url,
      response: { data: { id: asset.id } }
    };
  }

  // Update file lists for display
  private updatePrimaryFileList(): void {
    if (this.primaryAsset) {
      this.primaryFileList = [this.assetMetaToNzUploadFile(this.primaryAsset)];
    } else {
      this.primaryFileList = [];
    }
  }

  private updateAdditionalFileList(): void {
    this.additionalFileList = this.additionalAssets.map(asset => this.assetMetaToNzUploadFile(asset));
  }

  // Preview handler
  handlePreview = (file: NzUploadFile): void => {
    this.previewImage = file.url || file.thumbUrl || '';
    this.isImagePreview = file.type?.startsWith('image/') || false;
    this.previewVisible = true;
  }

  // BeforeUpload handlers
  beforeUploadPrimary = (file: NzUploadFile): boolean | Observable<boolean> => {
    const isImage = file.type?.startsWith('image/');
    
    if (!isImage) {
      this.message.error('Ảnh chính của sản phẩm chỉ chấp nhận định dạng hình ảnh!');
      return false;
    }
    
    const isLt10M = (file.size || 0) / 1024 / 1024 < 10;
    if (!isLt10M) {
      this.message.error('File phải nhỏ hơn 10MB!');
      return false;
    }

    this.uploadPrimaryAsset(file as any);
    return false; // Prevent default upload
  }

  // Upload handlers
  uploadPrimaryAsset(file: File): void {
    this.isUploading = true;
    // Tạo FormData để upload
    const formData = new FormData();
    formData.append('file', file);
    this.assetService.uploadAsset(formData).subscribe({
      next: (response) => {
        const assetData = response.data;
        this.primaryAsset = {
          id: assetData.id,
          url: `${environment.cdnBaseUrl}` + "/api/v1/asset/download/" + assetData.id,
          type: 'IMAGE',
          title: file.name,
          tags: [],
          isPrimary: true
        };
        
        // Update the file list for UI
        this.updatePrimaryFileList();
        
        this.isUploading = false;
        this.emitAssetsUpdated();
        this.message.success('Tải lên thành công!');
      },
      error: (error) => {
        this.isUploading = false;
        this.message.error('Tải lên thất bại: ' + error.message);
      }
    });
  }

  // Xử lý upload additional assets
  uploadAdditionalAssets(event: any): void {
    const files: FileList = event.target.files;
    if (files.length === 0) return;
    
    this.isUploadingMultiple = true;
    const uploadPromises: Promise<AssetMeta>[] = [];
    
    // Tạo mảng các promise upload
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Kiểm tra file type và size
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        this.message.warning(`Tệp ${file.name} không được hỗ trợ. Chỉ chấp nhận hình ảnh và video.`);
        continue;
      }
      
      const isLt1G = file.size / 1024 / 1024 < 1024;
      if (!isLt1G) {
        this.message.warning(`Tệp ${file.name} vượt quá giới hạn 1GB.`);
        continue;
      }
      
      // Tạo promise upload
      uploadPromises.push(
        new Promise<AssetMeta>((resolve) => {
          
          // Thực tế sẽ gọi API:
          const formData = new FormData();
          formData.append('file', file);
          
          this.assetService.uploadAsset(formData).subscribe({
            next: (response) => {
              const data = response.data;
              resolve({
                id: data.id,
                url: `${environment.cdnBaseUrl}` + "/api/v1/asset/download/" + data.id,
                type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
                title: file.name,
                tags: [],
                isPrimary: false
              });
            },
            error: (error) => {
              this.message.error(`Lỗi khi tải lên ${file.name}: ${error.message}`);
              resolve(null as any); // Xử lý lỗi
            }
          });
        })
      );
    }
    
    // Xử lý tất cả các promise upload
    Promise.all(uploadPromises).then(assets => {
      const validAssets = assets.filter(asset => asset !== null) as AssetMeta[];
      this.additionalAssets = [...this.additionalAssets, ...validAssets];
      this.updateAdditionalFileList();
      this.isUploadingMultiple = false;
      this.emitAssetsUpdated();
      
      if (validAssets.length > 0) {
        this.message.success(`Đã tải lên ${validAssets.length} tệp thành công!`);
      }
    });
  }

  // Xóa additional asset
  deleteAdditionalAsset(index: number): void {
    const assetToDelete = this.additionalAssets[index];
    
    // Giả lập API call xóa
    setTimeout(() => {
      this.additionalAssets.splice(index, 1);
      this.additionalAssets = [...this.additionalAssets]; // Tạo mảng mới để trigger change detection
      
      // Nếu asset đang được chọn bị xóa, reset selection
      if (this.selectedAsset && this.selectedAsset.id === assetToDelete.id) {
        this.selectedAsset = null;
        this.isMetadataPanelVisible = false;
      }
      
      this.emitAssetsUpdated();
      this.message.success('Đã xóa ảnh sản phẩm!');
    }, 500);
  }

  // Event handlers for nz-upload changes
  onPrimaryFileListChange(info: NzUploadChangeParam): void {
    // Cập nhật primaryFileList để hiển thị
    this.primaryFileList = [...info.fileList];

    // Khi file bị xóa khỏi danh sách
    if (info.fileList.length === 0 && this.primaryAsset) {
      this.primaryAsset = null;
      this.emitAssetsUpdated();
    }
  }
  
  // Chọn asset để xem/chỉnh sửa metadata
  selectAsset(asset: AssetMeta): void {
    this.selectedAsset = asset;
    
    // Cập nhật form với dữ liệu của asset được chọn
    this.metadataForm.patchValue({
      title: asset.title || '',
      altText: asset.altText || '',
      tags: asset.tags || []
    });
  }

  // Hiển thị panel metadata
  showMetadataPanel(): void {
    if (this.selectedAsset) {
      this.isMetadataPanelVisible = true;
    }
  }

  // Ẩn panel metadata
  hideMetadataPanel(): void {
    this.isMetadataPanelVisible = false;
  }

  // Lưu metadata
  saveMetadata(): void {
    if (!this.selectedAsset) return;
    
    const formValue = this.metadataForm.value;
    
    // Cập nhật metadata cho asset được chọn
    const updatedAsset = {
      ...this.selectedAsset,
      title: formValue.title,
      altText: formValue.altText,
      tags: formValue.tags
    };
    
    // Cập nhật trong mảng additionalAssets
    const index = this.additionalAssets.findIndex(a => a.id === this.selectedAsset?.id);
    if (index !== -1) {
      this.additionalAssets[index] = updatedAsset;
      this.additionalAssets = [...this.additionalAssets]; // Tạo mảng mới để trigger change detection
      this.selectedAsset = updatedAsset;
    }
    
    // Giả lập API call cập nhật
    setTimeout(() => {
      this.emitAssetsUpdated();
      this.message.success('Đã cập nhật metadata!');
    }, 500);
  }

  // Xử lý kéo thả panel metadata
  onDragDropped(event: CdkDragDrop<any>): void {
    // Xử lý vị trí mới của panel nếu cần
  }

  // Phương thức mới để hiển thị panel metadata cho asset cụ thể
  showMetadataPanelForAsset(asset: AssetMeta): void {
    // Cập nhật selectedAsset và form
    this.selectedAsset = asset;
    this.metadataForm.patchValue({
      title: asset.title || '',
      altText: asset.altText || '',
      tags: asset.tags || []
    });
    
    // Hiển thị panel
    this.isMetadataPanelVisible = true;
  }

  // Lọc assets theo searchText
  get filteredAssets(): AssetMeta[] {
    if (!this.searchText) return this.additionalAssets;
    
    return this.additionalAssets.filter(asset => 
      asset.title?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(this.searchText.toLowerCase()))
    );
  }

  // Emit assets updated
  emitAssetsUpdated(): void {
    const assets: ProductAssets = {
      primaryAsset: this.primaryAsset,
      additionalAssets: this.additionalAssets
    };
    this.assetsUpdated.emit(assets);
  }

  // Helper methods
  isImage(asset: AssetMeta | null): boolean {
    return asset?.type === 'IMAGE';
  }

  isVideo(asset: AssetMeta | null): boolean {
    return asset?.type === 'VIDEO';
  }

  // Hiển thị preview ảnh primary
  previewPrimaryImage(): void {
    if (this.primaryAsset) {
      this.previewImage = this.primaryAsset.url;
      this.isImagePreview = this.primaryAsset.type === 'IMAGE';
      this.previewVisible = true;
    }
  }

  // Xóa primary asset
  deletePrimaryAsset(): void {
    if (!this.primaryAsset) return;
    
    // Thực hiện xóa ảnh
    this.primaryAsset = null;
    this.primaryFileList = [];
    this.emitAssetsUpdated();
    this.message.success('Đã xóa ảnh chính của sản phẩm!');
  }
} 