import { Check } from 'lucide-react'
import { formatUSD } from '../../utils/format'
import { BAG_LOW_STOCK_THRESHOLD, bagSizeLabel } from '../../utils/stock'
import StockBadge from './StockBadge'

export default function BagSizeSelector({
  product,
  selectedWeights,
  onToggleWeight,
  availableBagsFor,
  pricePerBagFor,
}) {
  return (
    <div className="space-y-3">
      <p className="label-field">Select Bag Sizes</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {product.weightOptions.map((w) => {
          const available = availableBagsFor(w)
          const isSelected = selectedWeights.includes(w)
          const out = available <= 0

          return (
            <button
              key={w}
              type="button"
              onClick={() => !out && onToggleWeight(w)}
              disabled={out}
              className={`card p-4 text-left transition-all cursor-pointer relative ${
                isSelected
                  ? 'ring-2 ring-primary-500 bg-primary-50 border-primary-300'
                  : 'hover:shadow-cardHover border-black/5'
              } ${out ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-pressed={isSelected}
              aria-label={`${bagSizeLabel(product.weightOptions, w)} bag - ${formatUSD(pricePerBagFor(w))} per bag`}
            >
              {/* Selection indicator - top right */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" aria-hidden="true" />
                </div>
              )}

              <p className="font-bold text-sm">{bagSizeLabel(product.weightOptions, w)} Bag</p>
              <p className="text-primary-600 font-semibold text-sm mt-1">{formatUSD(pricePerBagFor(w))}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs text-ink/60">{available} in stock</span>
                <StockBadge stock={available} threshold={BAG_LOW_STOCK_THRESHOLD} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
