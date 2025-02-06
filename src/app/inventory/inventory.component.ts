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
    const filters: any = {};
    if (this.selectedStatus) filters.status = this.selectedStatus;
    if (this.selectedCategory) filters.category = this.selectedCategory;

    this.inventoryService.getProducts(filters).subscribe({
      next: (data) => {
        this.products = data.map(product => ({
          ...product,
          name: product.name || 'N/A',
          sku: product.sku || 'N/A',
          category: product.category || 'Uncategorized',
          status: product.status || 'in_stock',
          stockQuantity: product.stockQuantity || 0,
          manufacturer: product.manufacturer || 'Not Specified'
        }));
        this.table?.renderRows();
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

  applyFilters() {
    this.loadProducts();
  }

  resetFilters() {
    this.selectedStatus = '';
    this.selectedCategory = '';
    this.loadProducts();
  }
}
