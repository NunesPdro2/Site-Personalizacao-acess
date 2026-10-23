import { FormEvent, ReactNode, useMemo, useState } from "react"

type IconName = "arrow" | "bag" | "chevron" | "heart" | "home" | "lock" | "mail" | "orders" | "profile" | "search" | "sparkle"

type Product = {
  id: number
  name: string
  category: string
  price: string
  image: string
  badge?: string
}

const products: Product[] = [
  {
    id: 1,
    name: "Capinha Aura",
    category: "Capinhas",
    price: "R$ 69,90",
    badge: "Mais amado",
    image:
      "https://images.unsplash.com/photo-1592756086927-9a334c956fd1?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 2,
    name: "Case Candy",
    category: "Capinhas",
    price: "R$ 59,90",
    image:
      "https://images.unsplash.com/photo-1535157412991-2ef801c1748b?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 3,
    name: "Kit Charms Pop",
    category: "Charms",
    price: "R$ 34,90",
    badge: "Novo",
    image:
      "https://images.unsplash.com/photo-1731908984255-c59818147f5b?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 4,
    name: "Phone Strap Bloom",
    category: "Alças",
    price: "R$ 42,90",
    image:
      "https://images.unsplash.com/photo-1576107324820-c10884700b6b?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 5,
    name: "Case Blush",
    category: "Capinhas",
    price: "R$ 64,90",
    image:
      "https://images.unsplash.com/photo-1525226456211-24affe06d7dc?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 6,
    name: "Adesivos Mood",
    category: "Adesivos",
    price: "R$ 24,90",
    image:
      "https://images.unsplash.com/photo-1731908988110-f066dee752a8?auto=format&fit=crop&w=800&q=85",
  },
]

const categories = ["Todos", "Capinhas", "Charms", "Alças", "Adesivos"]

function Icon({
  name,
  size = 22,
  filled = false,
}: {
  name: IconName
  size?: number
  filled?: boolean
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: filled ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }

  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="m15 18-6-6 6-6" />
      </>
    ),
    bag: (
      <>
        <path d="M6 8h12l1 13H5L6 8Z" />
        <path d="M9 10V6a3 3 0 0 1 6 0v4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    orders: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 2 1.5 5.2L18 10l-4.5 2.8L12 18l-1.5-5.2L6 10l4.5-2.8L12 2Z" />
        <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
      </>
    ),
  }

  return <svg {...common}>{paths[name]}</svg>
}

function Brand() {
  return (
    <div className="brand" aria-label="Gotas de Amor">
      <img src="/assets/gotas-de-amor-logo.png" alt="" />
      <span>Gotas de Amor</span>
    </div>
  )
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [name, setName] = useState("")

  function submit(event: FormEvent) {
    event.preventDefault()
    onLogin()
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <Brand />
        </div>
        <h1>Gotas de Amor</h1>
        <form onSubmit={submit}>
          <label htmlFor="name">Nome</label>
          <div className="input-shell">
            <Icon name="profile" size={19} />
            <input
              id="name"
              type="text"
              placeholder="Digite seu nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <label htmlFor="password">Senha</label>
          <div className="input-shell">
            <Icon name="lock" size={19} />
            <input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              required
            />
          </div>
          <button type="button" className="text-button">
            Esqueceu sua senha?
          </button>
          <button className="primary-button" type="submit">
            Entrar <span>→</span>
          </button>
        </form>
      </section>
    </main>
  )
}

function Header({
  bagCount,
  onBag,
}: {
  bagCount: number
  onBag: () => void
}) {
  return (
    <header className="app-header">
      <Brand />
      <button
        className="bag-button"
        aria-label={bagCount ? "Abrir sacola" : "Sacola vazia"}
        onClick={onBag}
      >
        <Icon name="bag" />
        {bagCount > 0 && <span>{bagCount}</span>}
      </button>
    </header>
  )
}

function Home({
  onSelect,
  favorites,
  onFavorite,
}: {
  onSelect: (product: Product) => void
  favorites: number[]
  onFavorite: (id: number) => void
}) {
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [query, setQuery] = useState("")

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const inCategory =
          activeCategory === "Todos" || product.category === activeCategory
        const inSearch = product.name
          .toLowerCase()
          .includes(query.toLowerCase())
        return inCategory && inSearch
      }),
    [activeCategory, query],
  )

  return (
    <>
      <section className="welcome">
        <span className="eyebrow">FEITO PARA SER SEU</span>
        <h1>
          Olá, Marina! <span>✦</span>
        </h1>
        <p>O que vamos deixar com a sua cara hoje?</p>
      </section>

      <div className="search-box">
        <Icon name="search" size={20} />
        <input
          aria-label="Buscar produtos"
          placeholder="Busque capinhas, charms, alças..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <section className="hero-card">
        <div>
          <span className="eyebrow light">NOVA COLEÇÃO</span>
          <h2>
            Pequenos detalhes,
            <br />
            grandes histórias.
          </h2>
          <button type="button" onClick={() => onSelect(products[0])}>
            Explorar coleção <span>→</span>
          </button>
        </div>
        <span className="hero-sparkle">✦</span>
      </section>

      <section className="catalog-section">
        <div className="section-heading">
          <h2>Categorias</h2>
          <button type="button" onClick={() => setActiveCategory("Todos")}>
            Ver tudo
          </button>
        </div>
        <div className="category-scroll">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={activeCategory === category ? "active" : ""}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="catalog-section">
        <div className="section-heading">
          <h2>Queridinhos por aqui</h2>
          <span>{filtered.length} itens</span>
        </div>
        {filtered.length ? (
          <div className="product-grid">
            {filtered.map((product) => (
              <article className="product-card" key={product.id}>
                <button
                  className="product-image"
                  type="button"
                  onClick={() => onSelect(product)}
                >
                  <img src={product.image} alt={product.name} />
                  {product.badge && (
                    <span className="product-badge">{product.badge}</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`heart-button ${
                    favorites.includes(product.id) ? "liked" : ""
                  }`}
                  onClick={() => onFavorite(product.id)}
                  aria-label="Favoritar produto"
                >
                  <Icon
                    name="heart"
                    size={18}
                    filled={favorites.includes(product.id)}
                  />
                </button>
                <button
                  className="product-info"
                  type="button"
                  onClick={() => onSelect(product)}
                >
                  <span>{product.category}</span>
                  <strong>{product.name}</strong>
                  <b>{product.price}</b>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Icon name="search" size={30} />
            <h3>Nada por aqui</h3>
            <p>Tente buscar por outro nome ou categoria.</p>
          </div>
        )}
      </section>
    </>
  )
}

function ProductDetail({
  product,
  onBack,
  onCustomize,
  isFavorite,
  onFavorite,
}: {
  product: Product
  onBack: () => void
  onCustomize: () => void
  isFavorite: boolean
  onFavorite: () => void
}) {
  return (
    <section className="detail-page">
      <div className="detail-image">
        <img src={product.image} alt={product.name} />
        <button
          type="button"
          className="round-button back"
          onClick={onBack}
          aria-label="Voltar"
        >
          <Icon name="arrow" />
        </button>
        <button
          type="button"
          className={`round-button favorite ${isFavorite ? "liked" : ""}`}
          onClick={onFavorite}
          aria-label="Favoritar"
        >
          <Icon name="heart" filled={isFavorite} />
        </button>
        <span>Imagem ilustrativa</span>
      </div>
      <div className="detail-content">
        <span className="eyebrow">{product.category}</span>
        <h1>{product.name}</h1>
        <div className="rating">
          <span>★★★★★</span> 4.9 · 128 avaliações
        </div>
        <p className="detail-price">{product.price}</p>
        <p className="description">
          A base perfeita para criar algo só seu. Resistente, leve e pronta para
          receber suas cores, frases e detalhes favoritos.
        </p>
        <div className="detail-feature">
          <div>
            <Icon name="sparkle" />
          </div>
          <p>
            <strong>Personalize do seu jeito</strong>
            <span>Escolha cores, textos e acessórios.</span>
          </p>
          <Icon name="chevron" />
        </div>
        <button
          type="button"
          className="customize-button"
          onClick={onCustomize}
        >
          <Icon name="sparkle" /> Iniciar customização <span>→</span>
        </button>
        <p className="shipping-note">
          Produzido especialmente para você · envio em até 5 dias
        </p>
      </div>
    </section>
  )
}

function Checkout({
  items,
  onBack,
  onPay,
}: {
  items: Product[]
  onBack: () => void
  onPay: () => void
}) {
  const [payment, setPayment] = useState("")
  const total = items.reduce(
    (sum, item) =>
      sum + Number(item.price.replace("R$ ", "").replace(",", ".")),
    0,
  )
  const methods = [
    {
      id: "credit",
      mark: "C",
      title: "Cartão de crédito",
      copy: "Pague em até 3x",
    },
    {
      id: "debit",
      mark: "D",
      title: "Cartão de débito",
      copy: "Pagamento à vista",
    },
    { id: "pix", mark: "P", title: "Pix", copy: "Aprovação imediata" },
  ]

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <button type="button" onClick={onBack} aria-label="Voltar">
          <Icon name="arrow" />
        </button>
        <Brand />
        <span />
      </header>
      <div className="checkout-content">
        <section className="checkout-summary">
          <span className="eyebrow">SUA SACOLA</span>
          <h1>Revise seu pedido</h1>
          <div className="checkout-items">
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="checkout-item">
                <img src={item.image} alt="" />
                <p>
                  <strong>{item.name}</strong>
                  <span>Personalização selecionada</span>
                </p>
                <b>{item.price}</b>
              </div>
            ))}
          </div>
          <div className="checkout-total">
            <span>Total</span>
            <strong>
              {total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </div>
        </section>

        <section className="payment-section">
          <span className="eyebrow">PAGAMENTO</span>
          <h2>Como deseja pagar?</h2>
          <div className="payment-methods">
            {methods.map((method) => (
              <button
                type="button"
                key={method.id}
                className={payment === method.id ? "selected" : ""}
                onClick={() => setPayment(method.id)}
              >
                <span>{method.mark}</span>
                <p>
                  <strong>{method.title}</strong>
                  <small>{method.copy}</small>
                </p>
                <i>{payment === method.id ? "✓" : ""}</i>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="pay-button"
            disabled={!payment}
            onClick={onPay}
          >
            Pagar agora <span>→</span>
          </button>
          <p className="secure-payment">
            Pagamento seguro e seus dados protegidos.
          </p>
        </section>
      </div>
    </main>
  )
}

function SimplePage({ tab, favorites }: { tab: string, favorites: Product[] }) {
  const content: Record<string, {
    eyebrow: string
    title: string
    copy: string
  }> = {
    favorites: {
      eyebrow: "SUA CURADORIA",
      title: "Favoritos",
      copy: "As peças que mais combinam com você, reunidas aqui.",
    },
    orders: {
      eyebrow: "ACOMPANHE TUDO",
      title: "Meus pedidos",
      copy: "Você ainda não tem pedidos em andamento.",
    },
    profile: {
      eyebrow: "SEU ESPAÇO",
      title: "Minha conta",
      copy: "Marina Oliveira · marina@email.com",
    },
  }
  const item = content[tab]

  return (
    <section className="simple-page">
      <span className="eyebrow">{item.eyebrow}</span>
      <h1>{item.title}</h1>
      <p>{item.copy}</p>
      {tab === "favorites" && favorites.length > 0 ? (
        <div className="favorite-list">
          {favorites.map((product) => (
            <div key={product.id}>
              <img src={product.image} alt="" />
              <p>
                <strong>{product.name}</strong>
                <span>{product.price}</span>
              </p>
              <Icon name="chevron" />
            </div>
          ))}
        </div>
      ) : (
        <div className="simple-empty">
          <div>
            <Icon
              name={
                tab === "orders"
                  ? "orders"
                  : tab === "profile"
                    ? "profile"
                    : "heart"
              }
              size={34}
            />
          </div>
          <strong>
            {tab === "profile"
              ? "Tudo certo por aqui"
              : "Esse espaço está esperando por você"}
          </strong>
          <span>
            {tab === "profile"
              ? "Seus dados estão atualizados."
              : "Explore a loja e encontre seu próximo personalizado."}
          </span>
        </div>
      )}
    </section>
  )
}

function BottomNav({
  active,
  onChange,
}: {
  active: string
  onChange: (tab: string) => void
}) {
  const items = [
    { id: "home", label: "Início", icon: "home" as IconName },
    { id: "favorites", label: "Favoritos", icon: "heart" as IconName },
    { id: "orders", label: "Pedidos", icon: "orders" as IconName },
    { id: "profile", label: "Perfil", icon: "profile" as IconName },
  ]
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={active === item.id ? "active" : ""}
          onClick={() => onChange(item.id)}
        >
          <span>
            <Icon
              name={item.icon}
              size={21}
              filled={active === item.id && item.id === "favorites"}
            />
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [favorites, setFavorites] = useState<number[]>([])
  const [cart, setCart] = useState<Product[]>([])
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [toast, setToast] = useState("")

  function toggleFavorite(id: number) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  function customize() {
    if (selectedProduct) setCart((items) => [...items, selectedProduct])
    setToast("Customização iniciada! Sua peça foi adicionada à sacola.")
    window.setTimeout(() => setToast(""), 3200)
  }

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  if (checkoutOpen) {
    return (
      <Checkout
        items={cart}
        onBack={() => setCheckoutOpen(false)}
        onPay={() => {
          setCart([])
          setCheckoutOpen(false)
          setSelectedProduct(null)
          setActiveTab("home")
          setToast("Pagamento realizado! Obrigada por comprar com a gente.")
          window.setTimeout(() => setToast(""), 3200)
        }}
      />
    )
  }

  if (selectedProduct) {
    return (
      <main className="store-shell detail-shell">
        <ProductDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
          onCustomize={customize}
          isFavorite={favorites.includes(selectedProduct.id)}
          onFavorite={() => toggleFavorite(selectedProduct.id)}
        />
        {toast && <div className="toast">{toast}</div>}
      </main>
    )
  }

  return (
    <main className="store-shell">
      <Header
        bagCount={cart.length}
        onBag={() => cart.length > 0 && setCheckoutOpen(true)}
      />
      <div className="store-content">
        {activeTab === "home" ? (
          <Home
            onSelect={setSelectedProduct}
            favorites={favorites}
            onFavorite={toggleFavorite}
          />
        ) : (
          <SimplePage
            tab={activeTab}
            favorites={products.filter((item) => favorites.includes(item.id))}
          />
        )}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
