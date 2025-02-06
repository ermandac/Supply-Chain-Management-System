import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrdersService } from './orders.service';
import { AuthService } from '../auth/auth.service';

export interface OrderProduct {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  products: OrderProduct[];
  status: 'PENDING' | 'APPROVED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  customer: {
    _id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  @ViewChild(MatTable) table!: MatTable<Order>;

  displayedColumns: string[] = [
    'orderNumber',
    'customer',
    'products',
    'totalAmount',
    'status',
    'createdAt',
    'actions'
  ];

  orders: Order[] = [];
  isCustomer: boolean = false;
  selectedStatus: string = '';
  orderStatuses = ['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  constructor(
    private ordersService: OrdersService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const filters: any = {};
    if (this.selectedStatus) filters.status = this.selectedStatus;
    
    const currentUser = this.authService.currentUserValue;
    if (this.isCustomer && currentUser?._id) {
      filters.userId = currentUser._id;
    }
    
    this.ordersService.getOrders(filters).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.table?.renderRows();
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.snackBar.open('Error loading orders', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }

  applyFilters(): void {
    this.loadOrders();
  }

  resetFilters(): void {
    this.selectedStatus = '';
    this.loadOrders();
  }

  updateOrderStatus(order: Order, newStatus: string): void {
    if (!this.canUpdateStatus(order.status)) {
      this.snackBar.open('You do not have permission to update this order status', 'Close', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    this.ordersService.updateOrderStatus(order._id, newStatus).subscribe({
      next: (updatedOrder) => {
        const index = this.orders.findIndex(o => o._id === updatedOrder._id);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
          this.table?.renderRows();
        }
        this.snackBar.open('Order status updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        this.snackBar.open('Error updating order status', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        // Revert the status in the UI
        order.status = order.status;
      }
    });
  }

  calculateTotal(products: OrderProduct[]): number {
    return products.reduce((total, product) => total + (product.quantity * product.price), 0);
  }

  canUpdateStatus(status: string): boolean {
    if (this.isCustomer) {
      return status === 'PENDING'; // Customers can only update pending orders
    }
    return true; // Staff can update any status
  }
}
