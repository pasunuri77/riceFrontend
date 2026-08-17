import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatUSD } from '../../utils/format'
import { bagSizeLabel } from '../../utils/stock'
import ProductImage from './ProductImage'

export default function QuantityTable({
  product,
  selectedWeights,
  quantities,
  availableBagsFor,
  pricePerBagFor,
  onUpdateQuantity,
  onRemoveWeight,
  onAddAnother,
  subtotal,
  totalBags,
}) {
  if (selectedWeights.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <p className="label-field">Select Quantity <span className="text-xs font-normal text-ink/50">(You can add multiple bag sizes)</span></p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="text-left py-2 px-3 font-semibold text-ink/70">Item</th>
              <th className="text-right py-2 px-3 font-semibold text-ink/70">Price</th>
              <th className="text-center py-2 px-3 font-semibold text-ink/70">Quantity</th>
              <th className="text-right py-2 px-3 font-semibold text-ink/70">Total</th>
              <th className="text-center py-2 px-3 font-semibold text-ink/70">Action</th>
            </tr>
          </thead>
          <tbody>
            {selectedWeights.map((w) => {
              const qty = quantities[w] || 1
              const available = availableBagsFor(w)
              const price = pricePerBagFor(w)
              const lineTotal = price * qty

              return (
                <tr key={w} className="border-b border-black/5 hover:bg-primary-50/30 transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary-50 flex-shrink-0">
                        <ProductImage
                          src={product.image}
                          alt={`${product.name} - ${bagSizeLabel(product.weightOptions, w)}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{bagSizeLabel(product.weightOptions, w)}</p>
                        <p className="text-[11px] text-ink/50 truncate">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <p className="font-medium text-ink">{formatUSD(price)}</p>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center border border-black/10 rounded-lg w-fit mx-auto">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(w, qty - 1)}
                        disabled={qty <= 1}
                        className="p-1.5 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        aria-label={`Decrease quantity for ${bagSizeLabel(product.weightOptions, w)} bag`}
                      >
                        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm" aria-live="polite">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(w, qty + 1)}
                        disabled={qty >= available}
                        className="p-1.5 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        aria-label={`Increase quantity for ${bagSizeLabel(product.weightOptions, w)} bag`}
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <p className="font-semibold text-primary-700">{formatUSD(lineTotal)}</p>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveWeight(w)}
                      className="inline-flex items-center justify-center p-1.5 text-ink/50 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      aria-label={`Remove ${bagSizeLabel(product.weightOptions, w)} bag from selection`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add Another Size button */}
      {/* <button
        type="button"
        onClick={onAddAnother}
        className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition py-2"
      >
        + Add another size
      </button> */}

      {/* Subtotal */}
      <div className="flex items-center justify-end gap-6 pt-3 border-t border-black/5">
        <div className="text-right">
          <p className="text-xs text-ink/50">Subtotal ({totalBags} item{totalBags !== 1 ? 's' : ''})</p>
          <p className="font-bold text-primary-700 text-lg">{formatUSD(subtotal)}</p>
        </div>
      </div>
    </div>
  )
}
