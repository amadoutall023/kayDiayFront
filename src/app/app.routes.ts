import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { Register } from './components/auth/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { AdList } from './components/ads/ad-list/ad-list';
import { AdCreate } from './components/ads/ad-create/ad-create';
import { AdDetail } from './components/ads/ad-detail/ad-detail';
import { Home } from './components/home/home';
import { Verification } from './components/verification/verification';
import { CategoryList } from './components/admin/category-list/category-list';
import { CategoryCreate } from './components/admin/category-create/category-create';
import { SellerRequests } from './components/admin/seller-requests/seller-requests';
import { Sellers } from './components/admin/sellers/sellers';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'ads/:id', component: AdDetail },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'ads', pathMatch: 'full' },
      { path: 'ads', component: AdList },
      { path: 'ads/create', component: AdCreate },
      { path: 'categories', component: CategoryList },
      { path: 'categories/create', component: CategoryCreate },
      { path: 'verification', component: Verification },
      { path: 'seller-requests', component: SellerRequests },
      { path: 'sellers', component: Sellers }
    ]
  },
  { path: '**', redirectTo: '' }
];
