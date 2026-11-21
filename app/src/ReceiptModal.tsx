
import React from "react";
import type { CartItem } from "./POS";

type ReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  receiptNumber: string;
  cashReceived: number;
};

const ReceiptModal = ({
  isOpen,
  onClose,
  items,
  receiptNumber,
  cashReceived,
}: ReceiptModalProps) => {

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) =>
      sum + item.selectedSize.price * item.quantity,
    0
  );

  const change = cashReceived - subtotal;

  const date = new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex justify-center items-center p-4">

      <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl">

        {/* MODAL HEADER - HIDDEN WHEN PRINTING */}
        <div className="flex justify-between items-center p-4 border-b print:hidden">

          <h2 className="text-lg font-bold text-gray-800">
            Transaction Receipt
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-xl"
          >
            ✕
          </button>

        </div>

        {/* RECEIPT CONTENT */}
        <div id="receipt-content" className="p-6 text-gray-800 font-mono">

          {/* STORE INFORMATION */}
          <div className="text-center border-b border-dashed border-gray-400 pb-4">

            <h1 className="text-2xl font-black tracking-wider">
              DESARAPEN
            </h1>

            <p className="text-xs mt-1">
              Your Store Address
            </p>

            <p className="text-xs">
              Contact: 09XX-XXX-XXXX
            </p>

            <p className="text-xs mt-3 font-bold">
              SALES RECEIPT
            </p>

          </div>

          {/* TRANSACTION DETAILS */}
          <div className="py-4 text-xs space-y-1 border-b border-dashed border-gray-400">

            <div className="flex justify-between">
              <span>Receipt No:</span>
              <span>{receiptNumber}</span>
            </div>

            <div className="flex justify-between">
              <span>Date:</span>
              <span>{date.toLocaleDateString()}</span>
            </div>

            <div className="flex justify-between">
              <span>Time:</span>
              <span>{date.toLocaleTimeString()}</span>
            </div>

          </div>

          {/* ITEMS HEADER */}
          <div className="py-3 border-b border-dashed border-gray-400">

            <div className="grid grid-cols-12 text-xs font-bold mb-3">
              <span className="col-span-6">ITEM</span>
              <span className="col-span-2 text-center">QTY</span>
              <span className="col-span-4 text-right">AMOUNT</span>
            </div>

            {/* PURCHASED ITEMS */}
            {items.map((item) => (

              <div
                key={`${item._id}-${item.selectedSize.id}`}
                className="mb-3 text-xs"
              >

                <p className="font-bold">
                  {item.name}
                </p>

                <div className="grid grid-cols-12 mt-1">

                  <span className="col-span-6 text-gray-500">
                    {item.selectedSize.name} ({item.selectedSize.volume})
                  </span>

                  <span className="col-span-2 text-center">
                    {item.quantity}
                  </span>

                  <span className="col-span-4 text-right">
                    ₱{(
                      item.selectedSize.price * item.quantity
                    ).toFixed(2)}
                  </span>

                </div>

                <p className="text-gray-400 text-[10px]">
                  ₱{item.selectedSize.price.toFixed(2)} each
                </p>

              </div>

            ))}

          </div>

          {/* TOTALS */}
          <div className="py-4 border-b border-dashed border-gray-400 space-y-2 text-sm">

            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-black text-lg">
              <span>TOTAL</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span>Cash Received</span>
              <span>₱{cashReceived.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs font-bold">
              <span>Change</span>
              <span>₱{change.toFixed(2)}</span>
            </div>

          </div>

          {/* FOOTER */}
          <div className="text-center pt-5">

            <p className="font-bold text-sm">
              THANK YOU FOR YOUR PURCHASE!
            </p>

            <p className="text-xs text-gray-500 mt-2">
              Please come again!
            </p>

            <p className="text-[10px] text-gray-400 mt-4">
              This is a POS transaction receipt.
            </p>

          </div>

        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 p-4 border-t print:hidden">

          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
          >
            Close
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500"
          >
            Print Receipt
          </button>

        </div>

      </div>

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }

          #receipt-content,
          #receipt-content * {
            visibility: visible;
          }

          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
            color: black;
            background: white;
          }

          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>

    </div>
  );
};

export default ReceiptModal;
