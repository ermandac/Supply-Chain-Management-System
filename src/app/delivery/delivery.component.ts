import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeliveryService } from './delivery.service';
import { FormsModule } from '@angular/forms';

export interface Delivery {
  id: string;
  trackingNumber: string;
  order: {
    id: string;
    orderNumber: string;
    customer: {
      name: string;
      address: string;
      contact: string;
    }
  };
  status: 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  estimatedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  currentLocation?: string;
  notes?: string;
  assignedDriver?: {
    id: string;
    name: string;
    contact: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.scss']
})
export class DeliveryComponent implements OnInit {
  @ViewChild(MatTable) table!: MatTable<Delivery>;

  displayedColumns: string[] = [
    'trackingNumber',
    'orderNumber',
    'customer',
    'status',
    'estimatedDelivery',
    'currentLocation',
    'actions'
  ];

  deliveries: Delivery[] = [];
  selectedStatus: string = '';
  deliveryStatuses = ['PREPARING', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];

  resetFilters() {
    this.selectedStatus = '';
    this.applyFilters();
  }

  applyFilters() {
    // TODO: Implement filtering logic
  }

  constructor(
    private deliveryService: DeliveryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadDeliveries();
  }

  loadDeliveries() {
    const filters = this.selectedStatus ? { status: this.selectedStatus } : {};
    
    this.deliveryService.getDeliveries(filters).subscribe({
      next: (data) => {
        this.deliveries = data;
        this.table?.renderRows();
      },
      error: (error) => {
        this.snackBar.open('Error loading deliveries', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    });
  }

  updateDeliveryStatus(delivery: Delivery, newStatus: string) {
    this.deliveryService.updateDeliveryStatus(delivery.id, newStatus).subscribe({
      next: (updatedDelivery) => {
        const index = this.deliveries.findIndex(d => d.id === delivery.id);
        this.deliveries[index] = updatedDelivery;
        this.table.renderRows();
        
        this.snackBar.open('Delivery status updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        this.snackBar.open('Error updating delivery status', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    });
  }

  updateLocation(delivery: Delivery, newLocation: string) {
    this.deliveryService.updateDeliveryLocation(delivery.id, newLocation).subscribe({
      next: (updatedDelivery) => {
        const index = this.deliveries.findIndex(d => d.id === delivery.id);
        this.deliveries[index] = updatedDelivery;
        this.table.renderRows();
        
        this.snackBar.open('Location updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        this.snackBar.open('Error updating location', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    });
  }

  isDeliveryInProgress(status: string): boolean {
    return ['PREPARING', 'IN_TRANSIT'].includes(status);
  }
}
