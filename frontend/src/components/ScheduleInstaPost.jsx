import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FaInstagram } from 'react-icons/fa'
import { instagramApi } from '../api/client'

// Instagram posts always need media, so there is no "text only" option
const MEDIA_TYPES = [
  { id: 'image', label: 'Photo', accept: 'image/jpeg', maxMB: 8, hint: 'JPEG only, up to 8 MB' },
  { id: 'video', label: 'Video (Reel)', accept: 'video/mp4,video/quicktime', maxMB: 300, hint: 'MP4 or MOV, up to 300 MB' },
]

const IG_GRADIENT = 'bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#FCB045]'
const MAX_CHARS = 2200
const pad = (n) => String(n).padStart(2, '0')
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const formatSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`)

const IgAvatar = ({ account, className = 'h-10 w-10' }) => {
  const [failed, setFailed] = useState(false)

  if (account?.picture && !failed) {
    return (
      <img
        src={account.picture}
        alt={account.name}
        onError={() => setFailed(true)}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    )
  }

  return (
    <div className={`${className} ${IG_GRADIENT} flex shrink-0 items-center justify-center rounded-full text-white`}>
      <FaInstagram size={16} />
    </div>
  )
}

const ScheduleInstaPost = ({ onSaved }) => {
  const fileInput = useRef(null)

  // connected accounts
  const [accounts, setAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [accountsError, setAccountsError] = useState('')
  const [accountId, setAccountId] = useState('')

  // form
  const [caption, setCaption] = useState('')
  const [mediaType, setMediaType] = useState('image')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [dragging, setDragging] = useState(false)
  const [mode, setMode] = useState('schedule') // 'now' | 'schedule'
  const [when, setWhen] = useState('')
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  // Scheduled posts must be 10 minutes to 30 days ahead
  const [minWhen, maxWhen] = useMemo(() => {
    const now = Date.now()
    return [toLocalInput(new Date(now + 10 * 60000)), toLocalInput(new Date(now + 30 * 86400000))]
  }, [])

  // Load the user's connected Instagram accounts
  useEffect(() => {
    let cancelled = false

    const fetchAccounts = async () => {
      try {
        const res = await instagramApi.accounts()
        const list = Array.isArray(res) ? res : res?.accounts || res?.data || []
        const normalized = list.map((a) => ({
          id: String(a.id),
          name: a.username ? `@${a.username}` : 'Instagram account',
          picture: a.profilePictureUrl || '',
        }))
        if (cancelled) return
        setAccounts(normalized)
        setAccountId((cur) => cur || normalized[0]?.id || '')
      } catch (err) {
        if (!cancelled) setAccountsError(err.message)
      } finally {
        if (!cancelled) setLoadingAccounts(false)
      }
    }

    fetchAccounts()
    return () => {
      cancelled = true
    }
  }, [])

  // Local preview URL for the chosen file
  useEffect(() => {
    if (!file) return setPreviewUrl('')
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const current = MEDIA_TYPES.find((m) => m.id === mediaType)

  const pickType = (id) => {
    setMediaType(id)
    setFile(null)
    setErrors((e) => ({ ...e, file: undefined }))
  }

  const acceptFile = (f) => {
    if (!f) return
    const allowed = current.accept.split(',')
    if (!allowed.includes(f.type)) {
      return setErrors((e) => ({ ...e, file: `Wrong file type. ${current.hint}.` }))
    }
    if (f.size > current.maxMB * 1048576) {
      return setErrors((e) => ({ ...e, file: `File is over ${current.maxMB} MB.` }))
    }
    setErrors((e) => ({ ...e, file: undefined }))
    setFile(f)
  }

  const validate = () => {
    const e = {}
    if (!accountId) e.account = 'Select an Instagram account.'
    if (!file) e.file = `Add a ${mediaType === 'image' ? 'photo' : 'video'}. Instagram posts need media.`
    if (mode === 'schedule') {
      if (!when) e.when = 'Pick a date and time.'
      else if (when < minWhen) e.when = 'Schedule at least 10 minutes from now.'
      else if (when > maxWhen) e.when = 'Schedule no more than 30 days ahead.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const resetForm = () => {
    setCaption('')
    setFile(null)
    setMediaType('image')
    setWhen('')
    setErrors({})
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setDone('')
    setSubmitError('')
    if (!validate()) return

    const payload = {
      accountId,
      caption: caption.trim(),
      mediaType,
      file,
      mode,
      scheduledAt: mode === 'schedule' ? new Date(when).toISOString() : null,
    }

    setSaving(true)
    try {
      // Frontend only for now: uses the API call once it exists, otherwise just logs the payload
      if (typeof instagramApi.saveScheduledPost === 'function') {
        await instagramApi.saveScheduledPost(payload)
      } else {
        console.log('[ScheduleInstaPost] payload (no backend yet):', payload)
        await new Promise((resolve) => setTimeout(resolve, 600))
      }

      onSaved?.()
      setDone(
        mode === 'schedule'
          ? `Post scheduled for ${new Date(when).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`
          : 'Post saved.'
      )
      resetForm()
    } catch (error) {
      setSubmitError(error.message || 'Could not save the post.')
    } finally {
      setSaving(false)
    }
  }

  const selectedAccount = accounts.find((a) => a.id === accountId)
  const accountName = selectedAccount?.name || 'your_account'
  const input =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20'
  const label = 'mb-1.5 block text-sm font-medium text-slate-700'
  const err = (k) => errors[k] && <p className="mt-1.5 text-xs text-red-600">{errors[k]}</p>

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={handleSubmit} noValidate className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Schedule an Instagram post</h2>
          <p className="mt-1 text-sm text-slate-500">Add a photo or video, write a caption, and choose when it goes live.</p>
        </div>

        {done && (
          <div role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {done}
          </div>
        )}
        {submitError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Account select, filled from the connected Instagram accounts */}
        <div>
          <label htmlFor="account" className={label}>Instagram account</label>
          <div className="flex items-center gap-3">
            <IgAvatar account={selectedAccount} />
            <select
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={loadingAccounts || accounts.length === 0}
              className={input}
            >
              {loadingAccounts && <option value="">Loading accounts…</option>}
              {!loadingAccounts && accounts.length === 0 && <option value="">No connected accounts</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {accountsError && <p className="mt-1.5 text-xs text-red-600">{accountsError}</p>}
          {!loadingAccounts && !accountsError && accounts.length === 0 && (
            <p className="mt-1.5 text-xs text-slate-500">
              No Instagram accounts are connected yet. Use the Connect button at the top of this page.
            </p>
          )}
          {err('account')}
        </div>

        <div>
          <span className={label}>Media</span>
          <div role="tablist" className="mb-3 inline-flex rounded-lg bg-slate-100 p-1">
            {MEDIA_TYPES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mediaType === m.id}
                onClick={() => pickType(m.id)}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  mediaType === m.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files[0]) }}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center ${
              dragging ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-slate-50'
            }`}
          >
            {file ? (
              <div className="flex w-full items-center justify-between gap-3 text-left">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-700">
                  Drag a {mediaType === 'image' ? 'photo' : 'video'} here, or
                </p>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="mt-2 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Choose file
                </button>
                <p className="mt-2 text-xs text-slate-500">{current.hint}</p>
              </>
            )}
            <input
              ref={fileInput}
              type="file"
              accept={current.accept}
              className="hidden"
              onChange={(e) => { acceptFile(e.target.files[0]); e.target.value = '' }}
            />
          </div>
          {mediaType === 'video' && (
            <p className="mt-2 text-xs text-slate-500">Videos are published as Reels.</p>
          )}
          {err('file')}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="caption" className="text-sm font-medium text-slate-700">
              Caption <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <span className={`text-xs ${caption.length > MAX_CHARS ? 'text-red-600' : 'text-slate-400'}`}>
              {caption.length}/{MAX_CHARS}
            </span>
          </div>
          <textarea
            id="caption"
            rows={5}
            maxLength={MAX_CHARS}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption… use #hashtags and @mentions"
            className={`${input} resize-y`}
          />
          <p className="mt-1.5 text-xs text-slate-500">Links in captions are not clickable on Instagram.</p>
        </div>

        <fieldset>
          <legend className={label}>When to post</legend>
          <div className="mb-3 flex gap-2">
            {[
              { id: 'now', text: 'Post now' },
              { id: 'schedule', text: 'Schedule for later' },
            ].map((o) => (
              <label
                key={o.id}
                className={`flex-1 cursor-pointer rounded-lg border px-4 py-2.5 text-center text-sm font-medium ${
                  mode === o.id
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={o.id}
                  checked={mode === o.id}
                  onChange={() => setMode(o.id)}
                  className="sr-only"
                />
                {o.text}
              </label>
            ))}
          </div>
          {mode === 'schedule' && (
            <div>
              <input
                type="datetime-local"
                value={when}
                min={minWhen}
                max={maxWhen}
                onChange={(e) => setWhen(e.target.value)}
                aria-label="Publish date and time"
                className={input}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Between 10 minutes and 30 days from now, in your local time ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
              </p>
              {err('when')}
            </div>
          )}
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loadingAccounts || accounts.length === 0 || saving}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${IG_GRADIENT} bg-[length:200%_200%] bg-left hover:bg-right transition-all duration-200`}
          >
            {saving ? 'Saving…' : mode === 'schedule' ? 'Schedule post' : 'Save post'}
          </button>
        </div>
      </form>

      {/* Live preview */}
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-6">
        <p className="mb-3 text-sm font-medium text-slate-700">Preview</p>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="flex items-center gap-3 p-3">
            <IgAvatar account={selectedAccount} />
            <div>
              <p className="text-sm font-semibold text-slate-900">{accountName}</p>
              <p className="text-xs text-slate-500">
                {mode === 'schedule' && when
                  ? new Date(when).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                  : 'Just now'}
              </p>
            </div>
          </div>

          {previewUrl && mediaType === 'image' && (
            <img src={previewUrl} alt="Selected upload" className="max-h-96 w-full object-cover" />
          )}
          {previewUrl && mediaType === 'video' && (
            <video src={previewUrl} controls className="max-h-96 w-full bg-black" />
          )}
          {!previewUrl && (
            <div className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-400">
              Your photo or video will appear here.
            </div>
          )}

          {caption && (
            <p className="whitespace-pre-wrap break-words px-3 py-3 text-sm text-slate-800">
              <span className="font-semibold">{accountName.replace(/^@/, '')}</span> {caption}
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}

export default ScheduleInstaPost