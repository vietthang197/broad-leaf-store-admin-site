import { Routes } from '@angular/router';

export const EDIT_PRODUCT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'simple/:id',
    loadComponent: () => import('./edit-simple-product/edit-simple-product.component').then(m => m.EditSimpleProductComponent),
    title: 'Edit Simple Product'
  }
]; 