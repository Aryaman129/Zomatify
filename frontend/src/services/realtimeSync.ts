import supabase from './supabaseClient';
import { Order, OrderStatus } from '../types/index';
import { toast } from 'react-toastify';

export interface OrderUpdatePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Order;
  old?: Order;
}

export interface PaymentUpdatePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old?: any;
}

class RealtimeSyncService {
  private orderChannels: Map<string, any> = new Map();
  private paymentChannels: Map<string, any> = new Map();
  private customerOrderChannel: any = null;

  // Customer-side: Subscribe to order updates for a specific user
  subscribeToUserOrders(
    userId: string,
    onOrderUpdate: (payload: OrderUpdatePayload) => void
  ): () => void {
    const channelName = `user_orders_${userId}`;

    if (this.orderChannels.has(channelName)) {
      this.orderChannels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          console.log('Customer order update received:', payload);

          const update: OrderUpdatePayload = {
            eventType: payload.eventType,
            new: payload.new as Order,
            old: payload.old as Order
          };

          onOrderUpdate(update);

          // Show appropriate notifications
          if (payload.eventType === 'UPDATE' && payload.old && payload.new) {
            const oldStatus = payload.old.status;
            const newStatus = payload.new.status;

            if (oldStatus !== newStatus) {
              this.showOrderStatusNotification(newStatus, payload.new);
            }
          }
        }
      )
      .subscribe();

    this.orderChannels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.orderChannels.delete(channelName);
    };
  }

  // Vendor-side: Subscribe to orders for a specific vendor
  subscribeToVendorOrders(
    vendorId: string,
    onOrderUpdate: (payload: OrderUpdatePayload) => void
  ): () => void {
    const channelName = `vendor_orders_${vendorId}`;

    if (this.orderChannels.has(channelName)) {
      this.orderChannels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`
        },
        (payload: any) => {
          console.log('Vendor order update received:', payload);

          const update: OrderUpdatePayload = {
            eventType: payload.eventType,
            new: payload.new as Order,
            old: payload.old as Order
          };

          onOrderUpdate(update);

          // Show appropriate notifications for vendors
          if (payload.eventType === 'INSERT') {
            this.showNewOrderNotification(payload.new);
          }
        }
      )
      .subscribe();

    this.orderChannels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.orderChannels.delete(channelName);
    };
  }

  // Subscribe to payment updates for a vendor
  subscribeToVendorPayments(
    vendorId: string,
    onPaymentUpdate: (payload: PaymentUpdatePayload) => void
  ): () => void {
    const channelName = `vendor_payments_${vendorId}`;

    if (this.paymentChannels.has(channelName)) {
      this.paymentChannels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_payment_distributions',
          filter: `vendor_id=eq.${vendorId}`
        },
        (payload: any) => {
          console.log('Vendor payment update received:', payload);

          const update: PaymentUpdatePayload = {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          };

          onPaymentUpdate(update);

          // Show payment notifications
          if (payload.eventType === 'UPDATE' && payload.new.transfer_status === 'completed') {
            toast.success(`💰 Payment of ₹${payload.new.vendor_amount} received in your UPI account!`);
          }
        }
      )
      .subscribe();

    this.paymentChannels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.paymentChannels.delete(channelName);
    };
  }

  // Notification helpers
  private showOrderStatusNotification(status: OrderStatus, order: Order) {
    const customerName = order.delivery_address?.fullName || 'Customer';
    const billNumber = order.bill_number || 'N/A';

    switch (status) {
      case 'confirmed':
        toast.success(`✅ Order #${billNumber} confirmed! Your food is being prepared.`);
        break;
      case 'preparing':
        toast.info(`👨‍🍳 Order #${billNumber} is now being prepared!`);
        break;
      case 'ready':
        toast.success(`🍽️ Order #${billNumber} is ready for pickup/delivery!`);
        break;
      case 'delivered':
        toast.success(`🎉 Order #${billNumber} delivered successfully! Thank you!`);
        break;
      default:
        toast.info(`📋 Order #${billNumber} status updated to ${status}`);
    }
  }

  private showNewOrderNotification(order: Order) {
    const customerName = order.delivery_address?.fullName || 'Customer';
    const billNumber = order.bill_number || 'N/A';
    const amount = order.total_price;

    // Play notification sound (if available)
    this.playNotificationSound();

    toast.success(
      `🔔 New Order Received!\n👤 ${customerName}\n🧾 Bill #${billNumber}\n💰 ₹${amount.toFixed(2)}`,
      {
        autoClose: 8000,
        position: 'top-right'
      }
    );
  }

  private playNotificationSound() {
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }

  // Cleanup all subscriptions
  // Subscribe to menu item changes for customers
  subscribeToMenuUpdates(
    vendorId: string,
    onMenuUpdate: (payload: any) => void
  ): () => void {
    const channelName = `menu_updates_${vendorId}`;

    if (this.orderChannels.has(channelName)) {
      this.orderChannels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items',
          filter: `vendor_id=eq.${vendorId}`
        },
        (payload: any) => {
          console.log('Menu update received:', payload);
          onMenuUpdate(payload);

          // Show notifications for menu changes
          if (payload.eventType === 'UPDATE') {
            if (payload.new.is_available !== payload.old?.is_available) {
              const status = payload.new.is_available ? 'available' : 'out of stock';
              toast.info(`${payload.new.name} is now ${status}`);
            }
            if (payload.new.price !== payload.old?.price) {
              toast.info(`Price updated for ${payload.new.name}: ₹${payload.new.price}`);
            }
          }
        }
      )
      .subscribe();

    this.orderChannels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.orderChannels.delete(channelName);
    };
  }

  // Subscribe to vendor settings changes
  subscribeToVendorSettings(
    vendorId: string,
    onSettingsUpdate: (payload: any) => void
  ): () => void {
    const channelName = `vendor_settings_${vendorId}`;

    if (this.orderChannels.has(channelName)) {
      this.orderChannels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_settings',
          filter: `vendor_id=eq.${vendorId}`
        },
        (payload: any) => {
          console.log('Vendor settings update received:', payload);
          onSettingsUpdate(payload);

          // Show notifications for operational changes
          if (payload.eventType === 'UPDATE') {
            if (payload.new.is_accepting_orders !== payload.old?.is_accepting_orders) {
              const status = payload.new.is_accepting_orders ? 'accepting orders' : 'not accepting orders';
              toast.info(`Restaurant is now ${status}`);
            }
          }
        }
      )
      .subscribe();

    this.orderChannels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.orderChannels.delete(channelName);
    };
  }

  cleanup() {
    this.orderChannels.forEach(channel => channel.unsubscribe());
    this.paymentChannels.forEach(channel => channel.unsubscribe());

    this.orderChannels.clear();
    this.paymentChannels.clear();
  }
}

// Export singleton instance
export const realtimeSync = new RealtimeSyncService();
export default realtimeSync;
