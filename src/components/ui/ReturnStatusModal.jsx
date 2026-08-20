import { CheckCircle2, ClipboardCheck, PackageCheck, XCircle } from 'lucide-react'
import Modal from './Modal'
import { formatDateTime, formatUSD } from '../../utils/format'
import { paymentMethodLabel } from '../../data/returnRequests'

// Every entry is optional except "Submitted" - only stages that actually have
// a timestamp on the return request render, so a still-pending request just
// shows one step, an approved-but-not-yet-received one shows two, etc. All
// timestamps come straight from the backend (submittedAt/approvedAt/
// rejectedAt/receivedAt/refundProcessedAt via normalizeReturnRequest) -
// nothing here is guessed or hardcoded.
function buildSteps(request) {
  const steps = [
    { key: 'submitted', icon: ClipboardCheck, label: 'Return Request Submitted', at: request.requestedOn, tone: 'text-primary-600 bg-primary-50', detail: request.reason ? `Reason: ${request.reason}` : null },
  ]
  if (request.approvedAt) {
    steps.push({ key: 'approved', icon: CheckCircle2, label: 'Return Approved', at: request.approvedAt, tone: 'text-leaf-600 bg-leaf-50', detail: request.adminNote })
  }
  if (request.rejectedAt) {
    steps.push({ key: 'rejected', icon: XCircle, label: 'Return Rejected', at: request.rejectedAt, tone: 'text-red-600 bg-red-50', detail: request.adminNote })
  }
  if (request.receivedAt) {
    steps.push({ key: 'received', icon: PackageCheck, label: 'Item Received', at: request.receivedAt, tone: 'text-blue-600 bg-blue-50', detail: [request.receivedCondition, request.receivedNote].filter(Boolean).join(' - ') || null })
  }
  if (request.refundedAt) {
    steps.push({
      key: 'refunded',
      icon: CheckCircle2,
      label: 'Refund Completed',
      at: request.refundedAt,
      tone: 'text-leaf-600 bg-leaf-50',
      detail: [
        `${formatUSD(request.refundAmount)} to ${paymentMethodLabel(request)}`,
        request.refundReference ? `Ref: ${request.refundReference}` : null,
        request.refundNote,
      ].filter(Boolean).join(' - '),
    })
  }
  return steps
}

export default function ReturnStatusModal({ open, onClose, request }) {
  if (!request) return null
  const steps = buildSteps(request)

  return (
    <Modal open={open} onClose={onClose} title="Return Status" maxWidth="max-w-lg">
      <div className="space-y-5 text-sm">
        <div className="card p-3.5 space-y-1.5">
          <div className="flex justify-between"><span className="text-ink/50">Return Request</span><span className="font-semibold">{request.returnNumber}</span></div>
          <div className="flex justify-between"><span className="text-ink/50">Order</span><span className="font-semibold">{request.orderDisplayId}</span></div>
        </div>

        <div className="relative pl-8">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-black/10" aria-hidden="true" />
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.key} className="relative">
                <div className={`absolute -left-8 w-8 h-8 rounded-full ${step.tone} flex items-center justify-center`}>
                  <step.icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <p className="font-bold">{step.label}</p>
                <p className="text-xs text-ink/50 mt-0.5">{step.at ? formatDateTime(step.at) : '--'}</p>
                {step.detail && <p className="text-xs text-ink/60 mt-1">{step.detail}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="btn-outline">Close</button>
        </div>
      </div>
    </Modal>
  )
}
