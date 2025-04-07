import { Routes } from '@angular/router';
import { CreateSimpleProductComponent } from './create-simple-product/create-simple-product.component';

export const CREATE_PRODUCT_ROUTES: Routes = [
    { path: '', redirectTo: 'simple', pathMatch: 'full' },
  { path: 'simple', component: CreateSimpleProductComponent },
];
