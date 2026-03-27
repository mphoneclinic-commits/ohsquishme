import AdminLoginForm from './AdminLoginForm'

export default function AdminLoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          border: '1px solid #eadce3',
          borderRadius: 18,
          background: '#fff',
          padding: 24,
        }}
      >
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: 1.4,
            color: '#7a6f76',
          }}
        >
          Admin
        </p>

        <h1 style={{ marginTop: 0, marginBottom: 10 }}>Sign in</h1>
        <p style={{ marginTop: 0, color: '#7a6f76' }}>
          Only admin accounts can access the orders dashboard.
        </p>

        <AdminLoginForm />
      </div>
    </main>
  )
}