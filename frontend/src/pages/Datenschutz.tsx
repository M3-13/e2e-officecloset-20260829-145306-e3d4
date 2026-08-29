import type { CSSProperties } from 'react'

const cardStyle: CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
  marginBottom: 'var(--space-4)',
}

const sectionTitle: CSSProperties = {
  marginTop: 0,
  marginBottom: 'var(--space-3)',
  color: 'var(--color-accent)',
  fontSize: '1.25rem',
}

const mutedStyle: CSSProperties = { color: 'var(--color-muted)' }

const paragraph: CSSProperties = { margin: '0 0 var(--space-2)' }

const listStyle: CSSProperties = {
  margin: '0 0 var(--space-2)',
  paddingLeft: 'var(--space-4)',
  color: 'var(--color-muted)',
}

export default function Datenschutz() {
  return (
    <div className="page">
      <h1>Datenschutzerklärung</h1>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>1. Verantwortlicher</h2>
        <p style={paragraph}>
          Red Carpet Wardrobe
          <br />
          Musterstraße 12, 10115 Berlin
          <br />
          E-Mail: kontakt@red-carpet-wardrobe.example
        </p>
        <p style={{ ...paragraph, ...mutedStyle }}>
          Verantwortlich für die Verarbeitung personenbezogener Daten im Sinne der
          Datenschutz-Grundverordnung (DSGVO) ist der oben genannte Anbieter.
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>2. Umfang der Datenverarbeitung</h2>
        <p style={{ ...paragraph, ...mutedStyle }}>
          Wir verarbeiten personenbezogene Daten ausschließlich, soweit dies zur
          Bereitstellung einer funktionsfähigen Anwendung erforderlich ist. Dies umfasst:
        </p>
        <ul style={listStyle}>
          <li>E-Mail-Adresse bei der Registrierung und Anmeldung</li>
          <li>Selbst angelegte Kategorien, Kleidungsstücke und Outfits</li>
          <li>Hochgeladene Bilder zu Kleidungsstücken</li>
          <li>Ein zufällig erzeugtes Sitzungstoken zur Anmeldung</li>
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>3. Rechtsgrundlage</h2>
        <p style={{ ...paragraph, ...mutedStyle }}>
          Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur
          Erfüllung des mit der Nutzung der Anwendung geschlossenen Vertragsverhältnisses.
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>4. Sitzungscookies</h2>
        <p style={{ ...paragraph, ...mutedStyle }}>
          Zur Anmeldung wird ein Sitzungscookie gesetzt. Dieses ist ausschließlich für den
          Server auslesbar (HttpOnly) und wird nur für die Dauer der Nutzung gespeichert.
          Es werden keine Tracking- oder Analyse-Cookies eingesetzt.
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>5. Keine Drittanbieter-Ressourcen</h2>
        <p style={{ ...paragraph, ...mutedStyle }}>
          Diese Anwendung lädt keine Schriften, Skripte oder Styles von Drittanbietern.
          Alle Ressourcen werden lokal ausgeliefert, sodass ohne Ihre aktive Einwilligung
          keine Daten an Dritte übermittelt werden.
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>6. Speicherdauer</h2>
        <p style={{ ...paragraph, ...mutedStyle }}>
          Die Daten werden gespeichert, solange das Benutzerkonto besteht. Nach Löschung
          des Kontos werden sämtliche personenbezogenen Daten einschließlich Profil,
          Kategorien, Kleidungsstücke, Outfits und Bilder unwiderruflich entfernt.
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>7. Ihre Rechte</h2>
        <p style={{ ...paragraph, ...mutedStyle }}>
          Sie haben jederzeit das Recht auf Auskunft, Berichtigung und Löschung Ihrer
          Daten sowie auf Einschränkung der Verarbeitung, Datenübertragbarkeit und
          Widerspruch gegen die Verarbeitung. Zudem können Sie sich bei einer
          Datenschutz-Aufsichtsbehörde beschweren.
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>8. Kontolöschung</h2>
        <p style={{ ...paragraph, ...mutedStyle }}>
          Sie können Ihr Konto jederzeit über die Seite „Konto“ selbst löschen. Dabei
          werden alle zugehörigen personenbezogenen Daten dauerhaft entfernt.
        </p>
      </section>
    </div>
  )
}
