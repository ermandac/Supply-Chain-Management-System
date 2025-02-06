import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService, Product } from './inventory.service';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  @ViewChild(MatTable) table!: MatTable<Product>;
  
  displayedColumns: string[] = [
    'name',
    'sku',
    'category',
    'status',
    'itemStatus',
    'stockQuantity',
    'manufacturer',
    'actions'
  ];
  
  products: Product[] = [];
  selectedStatus: string = '';
  selectedCategory: string = '';

  categories = [
    'Diagnostic Imaging',
    'Patient Monitoring',
    'Surgical Equipment',
    'Sterilization',
    'Respiratory',
    'Rehabilitation',
    'Emergency',
    'Laboratory',
    'Dental',
    'Hospital Furniture',
    'Consumables',
    'Wound Care'
  ];

  statuses = ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'];

  constructor(
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.inventoryService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        this.snackBar.open('Error loading products', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    });
  }

  applyFilters() {
    const filters: { status?: string, category?: string } = {};
    
    if (this.selectedStatus) {
      filters.status = this.selectedStatus;
    }
    
    if (this.selectedCategory) {
      filters.category = this.selectedCategory;
    }

    this.inventoryService.getProducts(filters).subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        this.snackBar.open('Error applying filters', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    });
  }

  resetFilters() {
    this.selectedStatus = '';
    this.selectedCategory = '';
    this.loadProducts();
  }

  updateStatus(product: Product, newStatus: string) {
    this.inventoryService.updateProductStatus(product._id, newStatus).subscribe({
      next: (updatedProduct) => {
        const index = this.products.findIndex(p => p._id === product._id);
        this.products[index] = updatedProduct;
        this.table.renderRows();
        
        this.snackBar.open('Product status updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        this.snackBar.open('Error updating product status', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    });
  }

  updateItemStatus(product: Product, newItemStatus: string) {
    this.inventoryService.updateItemStatus(product._id, newItemStatus).subscribe({
      next: (updatedProduct) => {
        const index = this.products.findIndex(p => p._id === product._id);
        this.products[index] = updatedProduct;
        this.table.renderRows();
        
        this.snackBar.open('Item status updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        this.snackBar.open('Error updating item status', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    });
  }

  updateProductTracking(product: Product) {
    // Ensure trackingDetails exists
    product.trackingDetails = product.trackingDetails || {
      locationTracking: {}
    };

    // Ensure nested objects exist
    product.trackingDetails.locationTracking = 
      product.trackingDetails.locationTracking || {};

    this.inventoryService.updateProductTracking(product._id, {
      serialNumber: product.trackingDetails.serialNumber,
      locationTracking: {
        currentLocation: product.trackingDetails.locationTracking.currentLocation
      }
    }).subscribe({
      next: (updatedProduct) => {
        const index = this.products.findIndex(p => p._id === product._id);
        this.products[index] = updatedProduct;
        this.table.renderRows();
        
        this.snackBar.open('Product tracking details updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        this.snackBar.open('Error updating product tracking details', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    });
  }

  updateSerialNumber(product: Product, serialNumber: string) {
    // Ensure trackingDetails exists
    product.trackingDetails = product.trackingDetails || {};

    // Update serial number
    product.trackingDetails.serialNumber = serialNumber;

    // Call service to update
    this.inventoryService.updateProductTracking(product._id, {
      serialNumber: serialNumber
    }).subscribe({
      next: (updatedProduct) => {
        const index = this.products.findIndex(p => p._id === product._id);
        this.products[index] = updatedProduct;
        this.table.renderRows();
        
        this.snackBar.open('Serial number updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        this.snackBar.open('Error updating serial number', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    });
  }

  updateCurrentLocation(product: Product, currentLocation: string) {
    // Ensure trackingDetails and locationTracking exist
    product.trackingDetails = product.trackingDetails || {};
    product.trackingDetails.locationTracking = 
      product.trackingDetails.locationTracking || {};

    // Update current location
    product.trackingDetails.locationTracking.currentLocation = currentLocation;

    // Call service to update
    this.inventoryService.updateProductTracking(product._id, {
      locationTracking: {
        currentLocation: currentLocation
      }
    }).subscribe({
      next: (updatedProduct) => {
        const index = this.products.findIndex(p => p._id === product._id);
        this.products[index] = updatedProduct;
        this.table.renderRows();
        
        this.snackBar.open('Current location updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        this.snackBar.open('Error updating current location', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    });
  }

  scanBarcode(barcodeId: string) {
    if (!barcodeId) return;

    this.inventoryService.scanBarcode(barcodeId).subscribe({
      next: (product) => {
        const existingIndex = this.products.findIndex(p => p._id === product._id);
        
        if (existingIndex !== -1) {
          // Update existing product
          this.products[existingIndex] = product;
        } else {
          // Add new product
          this.products.push(product);
        }
        
        this.table.renderRows();
        this.snackBar.open('Product scanned successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        this.snackBar.open('Error scanning barcode', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    });
  }
}
