import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-create-simple-product',
  templateUrl: './create-simple-product.component.html',
  styleUrls: ['./create-simple-product.component.scss'],
  standalone: true,
  imports: [
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
    NzGridModule
  ]
})
export class CreateSimpleProductComponent implements OnInit {
  productForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Khởi tạo form với giá trị mặc định
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    this.productForm = this.fb.group({
      productType: ['SIMPLE', Validators.required],
      name: [null, [Validators.required]],
      sku: [null, [Validators.required]],
      slug: [null, [Validators.required]],
      category: [null, Validators.required],
      availableOnline: [true, Validators.required]
    });
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
}
