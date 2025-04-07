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

export interface AssetMeta {
  id: string;
  url: string;
  isPrimary: boolean;
  type: 'IMAGE' | 'VIDEO';
  title?: string;
  altText?: string;
  tags?: string[];
  file?: File;
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
  ]
})
export class ProductAssetsComponent implements OnChanges {
  @Input() initialAssets: AssetMeta[] = [];
  @Output() assetsUpdated = new EventEmitter<AssetMeta[]>();

  primaryAsset: AssetMeta | null = null;
  additionalAssets: AssetMeta[] = [];
  selectedAsset: AssetMeta | null = null;
  isMetadataPanelVisible = false;
  isUploading = false;

  isUploadingMultiple = false;
  searchText = '';
  metadataForm: FormGroup;

  // Cấu hình upload
  uploadUrl = 'http://localhost:8888/api/assets/upload';
  cdnBaseUrl = 'http://localhost:8888/assets/';

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    // private apiService: ApiService
  ) {
    this.metadataForm = this.fb.group({
      title: [''],
      altText: [''],
      tags: [[]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialAssets'] && this.initialAssets) {
      this.processInitialAssets();
    }
  }

  processInitialAssets(): void {
    this.primaryAsset = this.initialAssets.find(asset => asset.isPrimary) || null;
    this.additionalAssets = this.initialAssets.filter(asset => !asset.isPrimary);
  }

  // Xử lý upload primary asset
  beforeUpload = (file: NzUploadFile): boolean => {
    const isImage = file.type?.startsWith('image/');
    const isVideo = file.type?.startsWith('video/');
    
    if (!isImage && !isVideo) {
      this.message.error('Bạn chỉ có thể tải lên file hình ảnh hoặc video!');
      return false;
    }
    
    const isLt10M = (file.size || 0) / 1024 / 1024 < 10;
    if (!isLt10M) {
      this.message.error('File phải nhỏ hơn 10MB!');
      return false;
    }
    
    // Xử lý upload thủ công thay vì để nz-upload tự xử lý
    this.uploadPrimaryAsset(file as any);
    return false; // Ngăn nz-upload tự động upload
  };

  uploadPrimaryAsset(file: File): void {
    this.isUploading = true;
    
    // Tạo FormData để upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrimary', 'true');
    
    // Giả lập API call
    setTimeout(() => {
      // Giả định API trả về assetId
      const assetId = 'primary_' + Date.now();
      
      this.primaryAsset = {
        id: assetId,
        url: this.cdnBaseUrl + assetId,
        isPrimary: true,
        type: file.type?.startsWith('image/') ? 'IMAGE' : 'VIDEO',
        title: file.name,
        tags: []
      };
      
      this.isUploading = false;
      this.emitAssetsUpdated();
      this.message.success('Tải lên thành công!');
    }, 1500);
    
    // Thực tế sẽ gọi API:
    /*
    this.apiService.uploadAsset(formData).subscribe({
      next: (response) => {
        this.primaryAsset = {
          id: response.assetId,
          url: this.cdnBaseUrl + response.assetId,
          isPrimary: true,
          type: file.type?.startsWith('image/') ? 'IMAGE' : 'VIDEO',
          title: file.name,
          tags: []
        };
        this.isUploading = false;
        this.emitAssetsUpdated();
        this.message.success('Tải lên thành công!');
      },
      error: (error) => {
        this.isUploading = false;
        this.message.error('Tải lên thất bại: ' + error.message);
      }
    });
    */
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
      if (!isImage && !isVideo) continue;
      
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) continue;
      
      // Tạo promise upload
      uploadPromises.push(
        new Promise<AssetMeta>((resolve) => {
          // Giả lập API call
          setTimeout(() => {
            const assetId = 'additional_' + Date.now() + '_' + i;
            resolve({
              id: assetId,
              url: this.cdnBaseUrl + assetId,
              isPrimary: false,
              type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
              title: file.name,
              tags: []
            });
          }, 1000);
          
          // Thực tế sẽ gọi API:
          /*
          const formData = new FormData();
          formData.append('file', file);
          formData.append('isPrimary', 'false');
          
          this.apiService.uploadAsset(formData).subscribe({
            next: (response) => {
              resolve({
                id: response.assetId,
                url: this.cdnBaseUrl + response.assetId,
                isPrimary: false,
                type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
                title: file.name,
                tags: []
              });
            },
            error: () => {
              resolve(null); // Xử lý lỗi
            }
          });
          */
        })
      );
    }
    
    // Xử lý tất cả các promise upload
    Promise.all(uploadPromises).then(assets => {
      const validAssets = assets.filter(asset => asset !== null) as AssetMeta[];
      this.additionalAssets = [...this.additionalAssets, ...validAssets];
      this.isUploadingMultiple = false;
      this.emitAssetsUpdated();
      this.message.success(`Đã tải lên ${validAssets.length} ảnh sản phẩm thành công!`);
    });
  }

  // Xóa primary asset
  deletePrimaryAsset(): void {
    if (!this.primaryAsset) return;
    
    // Giả lập API call xóa
    setTimeout(() => {
      this.primaryAsset = null;
      this.emitAssetsUpdated();
      this.message.success('Đã xóa ảnh chính của sản phẩm!');
    }, 500);
    
    // Thực tế sẽ gọi API:
    /*
    this.apiService.deleteAsset(this.primaryAsset.id).subscribe({
      next: () => {
        this.primaryAsset = null;
        this.emitAssetsUpdated();
        this.message.success('Đã xóa tài sản chính!');
      },
      error: (error) => {
        this.message.error('Xóa thất bại: ' + error.message);
      }
    });
    */
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
    
    // Thực tế sẽ gọi API:
    /*
    this.apiService.deleteAsset(assetToDelete.id).subscribe({
      next: () => {
        this.additionalAssets.splice(index, 1);
        this.additionalAssets = [...this.additionalAssets];
        
        if (this.selectedAsset && this.selectedAsset.id === assetToDelete.id) {
          this.selectedAsset = null;
          this.isMetadataPanelVisible = false;
        }
        
        this.emitAssetsUpdated();
        this.message.success('Đã xóa tài sản!');
      },
      error: (error) => {
        this.message.error('Xóa thất bại: ' + error.message);
      }
    });
    */
  }

  // Xóa nhiều assets đã chọn
  deleteSelectedAssets(): void {
    // Thực hiện khi có chức năng chọn nhiều
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
    
    // Thực tế sẽ gọi API:
    /*
    this.apiService.updateAssetMetadata(updatedAsset.id, {
      title: formValue.title,
      altText: formValue.altText,
      tags: formValue.tags
    }).subscribe({
      next: () => {
        this.emitAssetsUpdated();
        this.message.success('Đã cập nhật metadata!');
      },
      error: (error) => {
        this.message.error('Cập nhật thất bại: ' + error.message);
      }
    });
    */
  }

  // Xử lý kéo thả panel metadata
  onDragDropped(event: CdkDragDrop<any>): void {
    // Xử lý vị trí mới của panel nếu cần
  }

  // Lọc assets theo searchText
  get filteredAssets(): AssetMeta[] {
    if (!this.searchText) return this.additionalAssets;
    
    return this.additionalAssets.filter(asset => 
      asset.title?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(this.searchText.toLowerCase()))
    );
  }

  // Phát ra sự kiện cập nhật assets
  emitAssetsUpdated(): void {
    const allAssets = [
      ...(this.primaryAsset ? [this.primaryAsset] : []),
      ...this.additionalAssets
    ];
    this.assetsUpdated.emit(allAssets);
  }

  // Kiểm tra xem asset có phải là hình ảnh không
  isImage(asset: AssetMeta | null): boolean {
    return asset?.type === 'IMAGE';
  }

  // Kiểm tra xem asset có phải là video không
  isVideo(asset: AssetMeta | null): boolean {
    return asset?.type === 'VIDEO';
  }

  // Xử lý khi checkbox thay đổi trạng thái
  onCheckboxChange(checked: boolean, asset: AssetMeta): void {
    if (checked) {
      // Nếu checkbox được check, cập nhật selectedAsset
      this.selectedAsset = asset;
      
      // Cập nhật form với dữ liệu của asset được chọn
      this.metadataForm.patchValue({
        title: asset.title || '',
        altText: asset.altText || '',
        tags: asset.tags || []
      });
    } else {
      // Nếu checkbox được bỏ check, đặt selectedAsset thành null
      this.selectedAsset = null;
    }
    
    // Đóng panel metadata khi thay đổi lựa chọn
    this.isMetadataPanelVisible = false;
  }

  // Xử lý khi checkbox của một item thay đổi
  onItemChecked(assetId: string, checked: boolean): void {
    if (checked) {
      // Nếu checkbox được check, cập nhật selectedAsset
      this.selectedAsset = this.additionalAssets.find(asset => asset.id === assetId) || null;
      
      // Cập nhật form với dữ liệu của asset được chọn
      if (this.selectedAsset) {
        this.metadataForm.patchValue({
          title: this.selectedAsset.title || '',
          altText: this.selectedAsset.altText || '',
          tags: this.selectedAsset.tags || []
        });
      }
    } else {
      // Nếu checkbox được bỏ check, đặt selectedAsset thành null
      if (this.selectedAsset?.id === assetId) {
        this.selectedAsset = null;
      }
    }
    
    // Đóng panel metadata khi thay đổi lựa chọn
    this.isMetadataPanelVisible = false;
  }
} 