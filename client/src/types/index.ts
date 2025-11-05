export interface TebexPackage {
    id: number
    name: string
    description: string
    image: string | null
    price: number
    base_price: string
    total_price: number
    currency: string
    discount: number
    created_at?: string
    sale?: {
        active: boolean
        discount: number
    }
}

export interface TebexCategory {
    id: number
    name: string
    description: string | null
    packages: TebexPackage[]
    subcategories?: TebexCategory[]
    parent?: {id: number; name: string}
}

export interface TebexBasket {
    ident: string
    complete: boolean
    links: {
        checkout: string
    }
    username?: string
    username_id?: number
}

export interface CartItem {
    package: TebexPackage
    quantity: number
}

export interface User {
    id: string
    username: string
    avatar?: string
    provider: "discord" | "cfx"
}

export interface AuthState {
    discord: User | null
    cfx: User | null
}