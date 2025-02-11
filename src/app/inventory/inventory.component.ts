import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { InventoryService, Product } from './inventory.service';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit, OnDestroy {
  @ViewChild(MatTable) table!: MatTable<Product>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<Product>([]);
  
  displayedColumns: string[] = [
    'instanceId',
    'name',
    'sku',
    'category',
    'serialNumber',
    'currentLocation',
    'status',
    'itemStatus',
    'actions'
  ];
  
  products: Product[] = [];
  selectedStatus: string = '';
  selectedCategory: string = '';
  selectedItemStatus: string = '';
  itemStatuses: string[] = ['demo', 'inventory', 'delivery', 'sold', 'returned', 'maintenance'];

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

  // Pagination properties
  totalProducts = 0;
  pageSize = 50;
  currentPage = 1;

  allProducts: Product[] = [];

  itemStatusCounts: { [key: string]: number } = {};

  constructor(
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Add event listener for screen resize
    window.addEventListener('resize', () => this.adjustColumnsForScreenSize());
    
    // Initial column adjustment
    this.adjustColumnsForScreenSize();
    
    // Load products
    this.loadProducts();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.adjustColumnsForScreenSize());
  }

  loadProducts() {
    this.inventoryService.getProducts(
      this.currentPage, 
      this.pageSize, 
      this.selectedStatus, 
      this.selectedCategory
    ).subscribe({
      next: (response) => {
        this.allProducts = response.products;
        this.dataSource.data = response.products;
        this.totalProducts = response.pagination.totalProducts;
        this.currentPage = response.pagination.currentPage;
        this.dataSource.sort = null;
        
        // Update item status counts
        this.initializeItemStatusCounts();
        
        // Optional: Set up paginator
        this.dataSource.paginator = this.paginator;
      },
      error: (error) => {
        console.error('Error loading products', error);
        this.snackBar.open('Failed to load products', 'Close', { duration: 3000 });
      }
    });
  }

  onPageChange(event: any) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  applyFilters() {
    this.currentPage = 1; // Reset to first page
    this.loadProducts();
  }

  resetFilters() {
    this.selectedStatus = '';
    this.selectedCategory = '';
    this.selectedItemStatus = '';
    
    // Restore all products
    this.dataSource.data = this.allProducts;
    
    // Reset pagination
    this.paginator.firstPage();
    this.totalProducts = this.allProducts.length;
  }

  updateStatus(product: Product, newStatus: string) {
    this.inventoryService.updateProductStatus(product._id, newStatus).subscribe({
      next: (updatedProduct) => {
        const index = this.dataSource.data.findIndex(p => p._id === product._id);
        if (index !== -1) {
          const updatedData = [...this.dataSource.data];
          updatedData[index] = updatedProduct;
          this.dataSource.data = updatedData;
        }
        
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
        const index = this.dataSource.data.findIndex(p => p._id === product._id);
        if (index !== -1) {
          const updatedData = [...this.dataSource.data];
          updatedData[index] = updatedProduct;
          this.dataSource.data = updatedData;
        }
        
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
    this.inventoryService.updateProductTracking(product._id, {
      serialNumber: product.serialNumber,
      currentLocation: product.currentLocation
    }).subscribe({
      next: (updatedProduct) => {
        const index = this.dataSource.data.findIndex(p => p._id === product._id);
        if (index !== -1) {
          const updatedData = [...this.dataSource.data];
          updatedData[index] = updatedProduct;
          this.dataSource.data = updatedData;
        }
        
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

  updateSerialNumber(product: Product, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const serialNumber = inputElement?.value || '';
    
    const trimmedSerialNumber = serialNumber.trim();
    
    if (trimmedSerialNumber && trimmedSerialNumber !== product.serialNumber) {
      this.inventoryService.updateProductSerialNumber(product._id, trimmedSerialNumber).subscribe({
        next: (updatedProduct) => {
          const index = this.dataSource.data.findIndex(p => p._id === product._id);
          if (index !== -1) {
            const updatedData = [...this.dataSource.data];
            updatedData[index] = updatedProduct;
            this.dataSource.data = updatedData;
          }
          
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
  }

  updateCurrentLocation(product: Product, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const currentLocation = inputElement?.value || '';
    
    const trimmedLocation = currentLocation.trim();
    
    if (trimmedLocation && trimmedLocation !== product.currentLocation) {
      this.inventoryService.updateCurrentLocation(product._id, trimmedLocation).subscribe({
        next: (updatedProduct) => {
          const index = this.dataSource.data.findIndex(p => p._id === product._id);
          if (index !== -1) {
            const updatedData = [...this.dataSource.data];
            updatedData[index] = updatedProduct;
            this.dataSource.data = updatedData;
          }
          
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
  }

  updatePurchaseDate(product: Product, event: MatDatepickerInputEvent<Date>) {
    const selectedDate = event.value;
    
    if (!selectedDate) {
      this.snackBar.open('Invalid date selected', 'Close', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
      return;
    }

    const purchaseDate = selectedDate.toISOString();
    
    const existingPurchaseDate = product.purchaseDate 
      ? new Date(product.purchaseDate).toISOString() 
      : null;
    
    if (purchaseDate !== existingPurchaseDate) {
      this.inventoryService.updatePurchaseDate(product._id, purchaseDate).subscribe({
        next: (updatedProduct) => {
          const index = this.dataSource.data.findIndex(p => p._id === product._id);
          if (index !== -1) {
            const updatedData = [...this.dataSource.data];
            updatedData[index] = updatedProduct;
            this.dataSource.data = updatedData;
          }
          
          this.snackBar.open('Purchase date updated successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
        },
        error: (error) => {
          this.snackBar.open('Error updating purchase date', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
        }
      });
    }
  }

  updateWarrantyExpirationDate(product: Product, event: MatDatepickerInputEvent<Date>) {
    const selectedDate = event.value;
    
    if (!selectedDate) {
      this.snackBar.open('Invalid warranty expiration date selected', 'Close', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
      return;
    }

    const warrantyExpirationDate = selectedDate.toISOString();
    
    const existingWarrantyDate = product.warrantyExpirationDate 
      ? new Date(product.warrantyExpirationDate).toISOString() 
      : null;
    
    if (warrantyExpirationDate !== existingWarrantyDate) {
      this.inventoryService.updateWarrantyExpirationDate(product._id, warrantyExpirationDate).subscribe({
        next: (updatedProduct) => {
          const index = this.dataSource.data.findIndex(p => p._id === product._id);
          if (index !== -1) {
            const updatedData = [...this.dataSource.data];
            updatedData[index] = updatedProduct;
            this.dataSource.data = updatedData;
          }
          
          this.snackBar.open('Warranty expiration date updated successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
        },
        error: (error) => {
          this.snackBar.open('Error updating warranty expiration date', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
        }
      });
    }
  }

  generateInstanceId(product: Product): string {
    const timestamp = new Date().getTime();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `${product.sku}-${timestamp}-${randomSuffix}`;
  }

  createProductInstance(productModel: Product) {
    const newInstance: Product = {
      ...productModel,
      _id: '', // Will be set by backend
      instanceId: this.generateInstanceId(productModel),
      status: 'in_stock',
      itemStatus: 'inventory',
      purchaseDate: new Date(),
      currentLocation: 'Warehouse'
    };

    this.inventoryService.createProductInstance(newInstance).subscribe({
      next: (createdInstance) => {
        this.dataSource.data.push(createdInstance);
        this.table.renderRows();
        this.snackBar.open('New product instance created', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        this.snackBar.open('Error creating product instance', 'Close', {
          duration: 3000
        });
      }
    });
  }

  scanBarcode(barcodeId: string) {
    if (!barcodeId) return;

    this.inventoryService.scanBarcode(barcodeId).subscribe({
      next: (product) => {
        const existingIndex = this.dataSource.data.findIndex(p => p._id === product._id);
        
        if (existingIndex !== -1) {
          // Update existing product
          this.dataSource.data[existingIndex] = product;
        } else {
          // Add new product
          this.dataSource.data.push(product);
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

  // Count Philips HeartStart FRx AED
  countPhilipsHeartStartFrx() {
    this.inventoryService.countProducts(
      'Philips HeartStart FRx AED'
    ).subscribe({
      next: (count) => {
        this.snackBar.open(`Number of Philips HeartStart FRx AED: ${count}`, 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        console.error('Error counting Philips HeartStart FRx AED:', error);
        this.snackBar.open('Error counting products', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    });
  }

  filterProductsByItemStatus() {
    if (!this.selectedItemStatus) {
      // If no status selected, show all products
      this.dataSource.data = this.allProducts;
    } else {
      // Filter products by selected item status
      this.dataSource.data = this.allProducts.filter(
        product => product.itemStatus === this.selectedItemStatus
      );
    }

    // Reset pagination
    this.paginator.firstPage();
    this.totalProducts = this.dataSource.data.length;
  }

  getProductCountByItemStatus(status: string): number {
    return this.allProducts.filter(product => product.itemStatus === status).length;
  }

  initializeItemStatusCounts() {
    // Reset counts
    this.itemStatusCounts = {};

    // Dynamically count products for each status
    this.itemStatuses.forEach(status => {
      this.itemStatusCounts[status] = this.getProductCountByItemStatus(status);
    });
  }

  adjustColumnsForScreenSize() {
    const screenWidth = window.innerWidth;
    
    if (screenWidth < 600) {
      // Mobile view: Reduce columns
      this.displayedColumns = [
        'name', 
        'category', 
        'status', 
        'actions'
      ];
    } else if (screenWidth < 992) {
      // Tablet view: Show fewer columns
      this.displayedColumns = [
        'instanceId',
        'name',
        'sku',
        'category',
        'status',
        'actions'
      ];
    } else {
      // Desktop view: Full columns
      this.displayedColumns = [
        'instanceId',
        'name',
        'sku',
        'category',
        'serialNumber',
        'currentLocation',
        'status',
        'itemStatus',
        'actions'
      ];
    }
  }
}
