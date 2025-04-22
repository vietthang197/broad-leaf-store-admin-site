import { Routes } from '@angular/router';
import { EditCategoryComponent } from './edit-category.component';

export const EDIT_CATEGORY_ROUTES: Routes = [
  { path: ':id', component: EditCategoryComponent }
]; 