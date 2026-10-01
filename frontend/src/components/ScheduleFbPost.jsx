import React, { useEffect, useMemo, useRef, useState } from 'react'
import { facebookApi } from '../api/client'

// Uses Tailwind classes. Replace `onSubmit` with your post/schedule API call.

const MEDIA_TYPES = [
  { id: 'none', label: 'Text only', accept: '', maxMB: 0 },
  { id: 'image', label: 'Photo', accept: 'image/*', maxMB: 10 },
  { id: 'video', label: 'Video', accept: 'video/*', maxMB: 1024 },
  { id: 'audio', label: 'Audio', accept: 'audio/*', maxMB: 100 },
]

const MAX_CHARS = 5000
const pad = (n) => String(n).padStart(2, '0')
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const formatSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`)

const ScheduleFbPost = ({
  onSubmit = (payload) => console.log('Post payload:', payload),
}) => {
  const fileInput = useRef(null)

  // connected accounts
  const [accounts, setAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [accountsError, setAccountsError] = useState('')
  const [pageId, setPageId] = useState('')

  // form
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [mediaType, setMediaType] = useState('none')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [dragging, setDragging] = useState(false)
  const [mode, setMode] = useState('schedule') // 'now' | 'schedule'
  const [when, setWhen] = useState('')
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState('')

  // Facebook accepts scheduled posts 10 minutes to 30 days ahead
  const [minWhen, maxWhen] = useMemo(() => {
    const now = Date.now()
    return [toLocalInput(new Date(now + 10 * 60000)), toLocalInput(new Date(now + 30 * 86400000))]
  }, [])

  // Load the user's saved Facebook accounts
  useEffect(() => {
    let cancelled = false

    const fetchAccounts = async () => {
      try {
        const res = await facebookApi.accounts()
        const list = Array.isArray(res) ? res : res?.fbAccounts || res?.accounts || res?.data || []
        const normalized = list.map((a) => ({
          id: a._id || a.id || a.pageId,
          name: a.name || a.pageName || a.accountName || 'Untitled Page',
          picture: a.picture || a.image || a.profilePicture || '',
        }))
        if (cancelled) return
        setAccounts(normalized)
        setPageId((cur) => cur || normalized[0]?.id || '')
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
    if (!f.type.startsWith(`${current.id}/`)) {
      return setErrors((e) => ({ ...e, file: `Choose a ${current.label.toLowerCase()} file.` }))
    }
    if (f.size > current.maxMB * 1048576) {
      return setErrors((e) => ({ ...e, file: `File is over ${current.maxMB} MB.` }))
    }
    setErrors((e) => ({ ...e, file: undefined }))
    setFile(f)
  }

  const validate = () => {
    const e = {}
    if (!pageId) e.page = 'Select a Page.'
    if (!message.trim() && !file) e.message = 'Write something or add media.'
    if (mediaType !== 'none' && !file) e.file = `Add a ${current.label.toLowerCase()} file.`
    if (link && !/^https?:\/\/\S+\.\S+/.test(link)) e.link = 'Enter a full link starting with https://'
    if (mode === 'schedule') {
      if (!when) e.when = 'Pick a date and time.'
      else if (when < minWhen) e.when = 'Schedule at least 10 minutes from now.'
      else if (when > maxWhen) e.when = 'Schedule no more than 30 days ahead.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const resetForm = () => {
    setMessage('')
    setLink('')
    setFile(null)
    setMediaType('none')
    setWhen('')
    setErrors({})
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    const payload = {
      pageId,
      message: message.trim(),
      link: link || undefined,
      mediaType,
      file,
      scheduledAt: mode === 'schedule' ? new Date(when).toISOString() : null,
    }
    onSubmit(payload)
    setDone(
      mode === 'schedule'
        ? `Scheduled for ${new Date(when).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`
        : 'Published.'
    )
    resetForm()
    setTimeout(() => setDone(''), 5000)
  }

  const selectedAccount = accounts.find((a) => a.id === pageId)
  const pageName = selectedAccount?.name || 'Your Page'
  const input =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
  const label = 'mb-1.5 block text-sm font-medium text-slate-700'
  const err = (k) => errors[k] && <p className="mt-1.5 text-xs text-red-600">{errors[k]}</p>

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={handleSubmit} noValidate className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Schedule a post</h2>
          <p className="mt-1 text-sm text-slate-500">Write it, add media, and choose when it goes live.</p>
        </div>

        {done && (
          <div role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {done}
          </div>
        )}

        {/* Page select, filled from saved accounts */}
        <div>
          <label htmlFor="page" className={label}>Page</label>
          <div className="flex items-center gap-3">
            {selectedAccount?.picture && (
              <img
                src={selectedAccount.picture}
                alt=""
                aria-hidden="true"
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            )}
            <select
              id="page"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              disabled={loadingAccounts || accounts.length === 0}
              className={input}
            >
              {loadingAccounts && <option value="">Loading accounts…</option>}
              {!loadingAccounts && accounts.length === 0 && <option value="">No connected Pages</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {accountsError && <p className="mt-1.5 text-xs text-red-600">{accountsError}</p>}
          {!loadingAccounts && !accountsError && accounts.length === 0 && (
            <p className="mt-1.5 text-xs text-slate-500">
              No Facebook account is connected yet.{' '}
              <a href={facebookApi.loginUrl()} className="font-medium text-blue-600 hover:underline">
                Connect Facebook
              </a>
            </p>
          )}
          {err('page')}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="message" className="text-sm font-medium text-slate-700">Post text</label>
            <span className={`text-xs ${message.length > MAX_CHARS ? 'text-red-600' : 'text-slate-400'}`}>
              {message.length}/{MAX_CHARS}
            </span>
          </div>
          <textarea
            id="message"
            rows={5}
            maxLength={MAX_CHARS}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What do you want to share?"
            className={`${input} resize-y`}
          />
          {err('message')}
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

          {mediaType !== 'none' && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files[0]) }}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center ${
                  dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'
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
                    <p className="text-sm text-slate-700">Drag a {current.label.toLowerCase()} file here, or</p>
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="mt-2 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Choose file
                    </button>
                    <p className="mt-2 text-xs text-slate-500">Up to {current.maxMB} MB</p>
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
              {mediaType === 'audio' && (
                <p className="mt-2 text-xs text-slate-500">
                  Facebook has no audio-only post, so audio is published as a video with a still cover.
                </p>
              )}
              {err('file')}
            </>
          )}
        </div>

        <div>
          <label htmlFor="link" className={label}>
            Link <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://example.com/article"
            className={input}
          />
          {err('link')}
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
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
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
            disabled={loadingAccounts || accounts.length === 0}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === 'schedule' ? 'Schedule post' : 'Publish now'}
          </button>
        </div>
      </form>

      {/* Live preview */}
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-6">
        <p className="mb-3 text-sm font-medium text-slate-700">Preview</p>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="flex items-center gap-3 p-3">
            {selectedAccount?.picture ? (
              <img
                src={selectedAccount.picture}
                alt={`${pageName} profile`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {pageName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">{pageName}</p>
              <p className="text-xs text-slate-500">
                {mode === 'schedule' && when
                  ? new Date(when).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                  : 'Just now'}
              </p>
            </div>
          </div>
          {message && <p className="whitespace-pre-wrap break-words px-3 pb-3 text-sm text-slate-800">{message}</p>}
          {previewUrl && mediaType === 'image' && (
            <img src={previewUrl} alt="Selected upload" className="max-h-80 w-full object-cover" />
          )}
          {previewUrl && mediaType === 'video' && <video src={previewUrl} controls className="max-h-80 w-full bg-black" />}
          {previewUrl && mediaType === 'audio' && (
            <div className="bg-slate-100 p-3">
              <audio src={previewUrl} controls className="w-full" />
            </div>
          )}
          {link && <p className="truncate border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">{link}</p>}
          {!message && !previewUrl && (
            <p className="px-3 pb-6 pt-2 text-sm text-slate-400">Your post will appear here as you write it.</p>
          )}
        </div>
      </aside>
    </div>
  )
}

export default ScheduleFbPost