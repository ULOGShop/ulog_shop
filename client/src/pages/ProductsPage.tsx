import {useState, useEffect, useMemo} from "react"
import {Container, Text, Image, Button, Group, Stack, Loader, Center, TextInput, Paper, Modal, Stepper, Box, Badge, Checkbox, MultiSelect, Divider, Menu, ScrollArea, Pagination} from "@mantine/core"
import {IconShoppingCart, IconSearch, IconUser, IconBrandDiscord, IconCheck, IconFilter, IconTag, IconChevronDown} from "@tabler/icons-react"
import {useNavigate} from "react-router-dom"
import {tebexApi} from "@/services/api"
import {useCart} from "@/contexts/CartContext"
import {useAuth} from "@/contexts/AuthContext"
import type {TebexCategory, TebexPackage} from "@/types"
import {notifications} from "@mantine/notifications"
import productTabsData from "@/data/productTabs.json"
import styles from "./ProductsPage.module.css"

interface TagObject {
    name: string
    bg: string
    text: string
}

export default function ProductsPage() {
    const [categories, setCategories] = useState<TebexCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState<number | "all">("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none")
    const [showOnlyFree, setShowOnlyFree] = useState(false)
    const [showOnlyDiscounted, setShowOnlyDiscounted] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authStep, setAuthStep] = useState(0)
    const [pendingPackage, setPendingPackage] = useState<TebexPackage | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const {addItem, items, removeItem} = useCart()
    const {cfxUser, discordUser, login} = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        try {
            const res = await tebexApi.getCategories()
            const processedCategories: TebexCategory[] = []
            const categoryMap = new Map<number, TebexCategory>()
            res.data.forEach((cat) => {
                categoryMap.set(cat.id, {...cat, subcategories: []})
            })
            res.data.forEach((cat) => {
                const category = categoryMap.get(cat.id)!
                if (cat.parent && cat.parent.id) {
                    const parentCat = categoryMap.get(cat.parent.id)
                    if (parentCat) {
                        if (!parentCat.subcategories) parentCat.subcategories = []
                        parentCat.subcategories.push(category)
                    }
                } else {
                    processedCategories.push(category)
                }
            })
            setCategories(processedCategories)
        } catch (error) {
            notifications.show({title: "Error", message: "Failed to load products", color: "red"})
        } finally {
            setLoading(false)
        }
    }

    const allTags = useMemo(() => {
        const tags = new Set<string>()
        const packages = (productTabsData as any).packages || {}
        Object.values(packages).forEach((product: any) => {
            if (product && product.tags && Array.isArray(product.tags)) {
                product.tags.forEach((tag: string | TagObject) => {
                    const tagName = typeof tag === "string" ? tag : tag.name
                    tags.add(tagName)
                })
            }
        })
        return Array.from(tags).sort()
    }, [])

    const isRecentProduct = (createdAt?: string) => {
        if (!createdAt) return false
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return new Date(createdAt) > thirtyDaysAgo
    }

    const displayedPackages = useMemo(() => {
        let packages: TebexPackage[] = []
        if (activeCategory === "all") {
            categories.forEach((cat) => {
                packages = packages.concat(cat.packages || [])
                cat.subcategories?.forEach((subcat) => {
                    packages = packages.concat(subcat.packages || [])
                })
            })
        } else {
            const category = categories.flatMap((c) => [c, ...(c.subcategories || [])]).find((c) => c.id === activeCategory)
            packages = category?.packages || []
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            packages = packages.filter((pkg) => pkg.name.toLowerCase().includes(query) || pkg.description?.toLowerCase().includes(query))
        }
        if (selectedTags.length > 0) {
            packages = packages.filter((pkg) => {
                const packagesData = (productTabsData as any).packages || {}
                const productData = packagesData[pkg.id.toString()]
                if (!productData?.tags) return false
                const pkgTags = productData.tags.map((tag: string | TagObject) =>
                    typeof tag === "string" ? tag : tag.name
                )
                return selectedTags.every((tag) => pkgTags.includes(tag))
            })
        }
        if (showOnlyFree) {
            packages = packages.filter((pkg) => pkg.total_price === 0)
        }
        if (showOnlyDiscounted) {
            packages = packages.filter((pkg) => pkg.discount > 0)
        }
        if (priceSort !== "none") {
            packages = [...packages].sort((a, b) => {
                const priceA = a.total_price
                const priceB = b.total_price
                return priceSort === "asc" ? priceA - priceB : priceB - priceA
            })
        }
        return packages
    }, [categories, activeCategory, searchQuery, selectedTags, showOnlyFree, showOnlyDiscounted, priceSort])

    const paginatedPackages = useMemo(() => {
        const startIndex = (currentPage - 1)*itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return displayedPackages.slice(startIndex, endIndex)
    }, [displayedPackages, currentPage, itemsPerPage])

    const totalPages = Math.ceil(displayedPackages.length/itemsPerPage)

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    const handleAddToCart = (pkg: TebexPackage) => {
        if (!cfxUser || !discordUser) {
            setPendingPackage(pkg)
            setAuthStep(!cfxUser ? 0 : 1)
            setShowAuthModal(true)
            return
        }
        addItem(pkg, 1)
        notifications.show({title: "Added to cart", message: `${pkg.name} has been added to your cart`, color: "green"})
    }

    const isInCart = (packageId: number) => {
        return items.some((item) => item.package.id === packageId)
    }

    const handleAuthComplete = () => {
        setShowAuthModal(false)
        setAuthStep(0)
        if (pendingPackage && cfxUser && discordUser) {
            handleAddToCart(pendingPackage)
            setPendingPackage(null)
        }
    }

    const handleCFXAuth = async () => {
        await login("cfx")
        if (discordUser) {
            handleAuthComplete()
        } else {
            setAuthStep(1)
        }
    }

    const handleDiscordAuth = async () => {
        await login("discord")
        if (cfxUser) {
            handleAuthComplete()
        }
    }

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat("en-US", {style: "currency", currency: currency}).format(price)
    }

    const getTagColor = (tag: string | TagObject) => {
        if (typeof tag === "object" && tag.bg && tag.text) {
            return {bg: tag.bg, text: tag.text}
        }
        return {bg: "#2a2a2a", text: "#FFFFFF"}
    }

    const activeFiltersCount = selectedTags.length + (showOnlyFree ? 1 : 0) + (showOnlyDiscounted ? 1 : 0) + (priceSort !== "none" ? 1 : 0)

    if (loading) {
        return (
            <Center style={{minHeight: "80vh"}}>
                <Loader size="xl" color="lime"/>
            </Center>
        )
    }

    return (
        <Box>
            <Container size="xl" py={20}>
                <Stack gap="md" mb={20}>
                    <Paper p="sm" radius="sm" style={{background: "#1a1a1a", border: "1px solid #2a2a2a"}}>
                        <Group gap="md">
                            <TextInput placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} leftSection={<IconSearch size={20}/>} radius="sm" flex={1} styles={{input: {background: "#111111", border: "1px solid #2a2a2a", color: "#FFFFFF", "&:focus": {borderColor: "#BAF329"}}}}/>
                            <Menu opened={filtersOpen} onChange={setFiltersOpen} position="bottom-end" width={400} shadow="xl" styles={{dropdown: {background: "#1a1a1a", border: "1px solid #2a2a2a", padding: 0}}}>
                                <Menu.Target>
                                    <Button variant="outline" leftSection={<IconFilter size={20}/>} radius="sm" styles={{root: {borderColor: activeFiltersCount > 0 ? "#BAF329" : "#2a2a2a", color: activeFiltersCount > 0 ? "#BAF329" : "#FFFFFF", background: activeFiltersCount > 0 ? "rgba(186, 243, 41, 0.1)" : "transparent", "&:hover": {background: "rgba(186, 243, 41, 0.1)", borderColor: "#BAF329"}}}}>
                                        Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                                    </Button>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <ScrollArea.Autosize mah={500}>
                                        <Stack gap="lg" p="lg">
                                            <Box>
                                                <Text fw={600} c="#FFFFFF" mb="sm" size="sm">
                                                    Sort by Price
                                                </Text>
                                                <Group gap={4} wrap="nowrap">
                                                    {[{label: "Default", value: "none"}, {label: "Low to High", value: "asc"}, {label: "High to Low", value: "desc"}].map((option) => (
                                                        <Button key={option.value} onClick={() => setPriceSort(option.value as "none" | "asc" | "desc")} fullWidth size="xs" radius="sm" variant={priceSort === option.value ? "filled" : "subtle"} styles={{root: {background: priceSort === option.value ? "#BAF329" : "#111111", color: priceSort === option.value ? "#111111" : "#FFFFFF", border: `1px solid ${priceSort === option.value ? "#BAF329" : "#2a2a2a"}`, fontSize: "12px", height: "32px", "&:hover": {background: priceSort === option.value ? "#a8db25" : "#1a1a1a"}}}}>
                                                            {option.label}
                                                        </Button>
                                                    ))}
                                                </Group>
                                            </Box>
                                            <Divider color="#2a2a2a"/>
                                            <Box>
                                                <Group mb="sm" justify="space-between">
                                                    <Group gap="xs">
                                                        <IconTag size={16} color="#FFFFFF"/>
                                                        <Text fw={600} c="#FFFFFF" size="sm">
                                                            Filter by Tags
                                                        </Text>
                                                    </Group>
                                                    {selectedTags.length > 0 && (
                                                        <Text size="xs" c="#BAF329">
                                                            {selectedTags.length} selected
                                                        </Text>
                                                    )}
                                                </Group>
                                                <MultiSelect placeholder={allTags.length === 0 ? "No tags available" : "Select tags..."} data={allTags} value={selectedTags} onChange={setSelectedTags} searchable clearable radius="sm" disabled={allTags.length === 0} styles={{input: {background: "#111111", border: "1px solid #2a2a2a", color: "#FFFFFF", "&:focus": {borderColor: "#BAF329"}}, pill: {background: "#BAF329", color: "#111111"}, dropdown: {background: "#111111", border: "1px solid #2a2a2a"}, option: {color: "#FFFFFF", fontSize: "13px", "&:hover": {background: "#2a2a2a"}}}}/>
                                            </Box>
                                            <Divider color="#2a2a2a"/>
                                            <Box>
                                                <Text fw={600} c="#FFFFFF" mb="sm" size="sm">
                                                    Quick Filters
                                                </Text>
                                                <Stack gap="sm">
                                                    <Checkbox label="Show only free products" checked={showOnlyFree} onChange={(e) => setShowOnlyFree(e.currentTarget.checked)} styles={{label: {color: "#FFFFFF", fontSize: "14px"}, input: {"&:checked": {background: "#BAF329", borderColor: "#BAF329"}}}}/>
                                                    <Checkbox label="Show only discounted products" checked={showOnlyDiscounted} onChange={(e) => setShowOnlyDiscounted(e.currentTarget.checked)} styles={{label: {color: "#FFFFFF", fontSize: "14px"}, input: {"&:checked": {background: "#BAF329", borderColor: "#BAF329"}}}}/>
                                                </Stack>
                                            </Box>
                                            <Divider color="#2a2a2a"/>
                                            <Button fullWidth variant="outline" radius="sm" size="sm" onClick={() => {setSelectedTags([]), setShowOnlyFree(false), setShowOnlyDiscounted(false), setPriceSort("none")}} styles={{root: {borderColor: "#2a2a2a", color: "#FFFFFF", "&:hover": {background: "#2a2a2a"}}}}>
                                                Clear All Filters
                                            </Button>
                                        </Stack>
                                    </ScrollArea.Autosize>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    </Paper>
                    <Group gap="sm" justify="center" style={{flexWrap: "wrap"}}>
                        <Button key="all" variant={activeCategory === "all" ? "filled" : "outline"} onClick={() => setActiveCategory("all")} radius="xl" size="sm" styles={{root: {background: activeCategory === "all" ? "#BAF329" : "transparent", color: activeCategory === "all" ? "#111111" : "#FFFFFF", borderColor: activeCategory === "all" ? "#BAF329" : "#2a2a2a", "&:hover": {background: activeCategory === "all" ? "#a8db25" : "rgba(186, 243, 41, 0.1)", borderColor: "#BAF329"}}}}>
                            All Products
                        </Button>
                        {categories.map((category) => {
                            const hasSubcategories = category.subcategories && category.subcategories.length > 0
                            if (hasSubcategories) {
                                return (
                                    <Menu key={category.id} position="bottom-start" shadow="xl" width={200}>
                                        <Menu.Target>
                                            <Button variant="outline" radius="xl" size="sm" rightSection={<IconChevronDown size={14}/>} styles={{root: {background: "transparent", color: "#FFFFFF", borderColor: "#2a2a2a", "&:hover": {background: "rgba(186, 243, 41, 0.1)", borderColor: "#BAF329"}}}}>
                                                {category.name}
                                            </Button>
                                        </Menu.Target>
                                        <Menu.Dropdown style={{background: "#1a1a1a", border: "1px solid #2a2a2a"}}>
                                            {category.subcategories!.map((subcat) => (
                                                <Menu.Item key={subcat.id} onClick={() => setActiveCategory(subcat.id)} styles={{item: {color: activeCategory === subcat.id ? "#BAF329" : "#FFFFFF", background: activeCategory === subcat.id ? "rgba(186, 243, 41, 0.1)" : "transparent", "&:hover": {background: "#2a2a2a"}}}}>
                                                    {subcat.name}
                                                </Menu.Item>
                                            ))}
                                        </Menu.Dropdown>
                                    </Menu>
                                )
                            }
                            return (
                                <Button key={category.id} variant={activeCategory === category.id ? "filled" : "outline"} onClick={() => setActiveCategory(category.id)} radius="xl" size="sm" styles={{root: {background: activeCategory === category.id ? "#BAF329" : "transparent", color: activeCategory === category.id ? "#111111" : "#FFFFFF", borderColor: activeCategory === category.id ? "#BAF329" : "#2a2a2a", "&:hover": {background: activeCategory === category.id ? "#a8db25" : "rgba(186, 243, 41, 0.1)", borderColor: "#BAF329"}}}}>
                                    {category.name}
                                </Button>
                            )
                        })}
                    </Group>
                </Stack>
                {displayedPackages.length === 0 ? (
                    <Center py={60}>
                        <Stack align="center" gap="md">
                            <IconSearch size={48} color="#666666"/>
                            <Text size="xl" c="#666666">
                                No products found
                            </Text>
                            <Text size="sm" c="#666666">
                                Try adjusting your filters or search query
                            </Text>
                        </Stack>
                    </Center>
                ) : (
                    <>
                        <style>{`
                            .products-grid {
                                display: grid;
                                grid-template-columns: repeat(5, 1fr);
                                gap: 16px;
                                width: 100%;
                                align-content: start;
                                min-height: 520px;
                            }
                            @media (max-width: 1400px) {
                                .products-grid {
                                grid-template-columns: repeat(4, 1fr);
                                min-height: 540px;
                                }
                            }
                            @media (max-width: 1100px) {
                                .products-grid {
                                grid-template-columns: repeat(3, 1fr);
                                min-height: 560px;
                                }
                            }
                            @media (max-width: 800px) {
                                .products-grid {
                                grid-template-columns: repeat(2, 1fr);
                                min-height: 580px;
                                }
                            }
                            @media (max-width: 500px) {
                                .products-grid {
                                grid-template-columns: repeat(1, 1fr);
                                min-height: 0;
                                }
                            }
                        `}</style>
                        <Box className="products-grid">
                            {paginatedPackages.map((pkg) => {
                                const packagesData = (productTabsData as any).packages || {}
                                const productData = packagesData[pkg.id.toString()]
                                const isNew = isRecentProduct(pkg.created_at)

                                return (
                                    <Paper key={pkg.id} radius="sm" style={{background: "#1a1a1a", border: "1px solid #2a2a2a", overflow: "hidden", cursor: "pointer", transition: "all 0.3s ease"}} onMouseEnter={(e) => {e.currentTarget.style.transform = "translateY(-4px)", e.currentTarget.style.borderColor = "#BAF329", e.currentTarget.style.boxShadow = "0 8px 24px rgba(186, 243, 41, 0.15)"}} onMouseLeave={(e) => {e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.borderColor = "#2a2a2a", e.currentTarget.style.boxShadow = "none"}} onClick={() => navigate(`/product/${pkg.id}`)}>
                                        <Box style={{ position: "relative", width: "100%" }}>
                                            <Image src={pkg.image || "https://via.placeholder.com/400x200"} alt={pkg.name} width="100%" style={{display: "block", objectFit: "contain"}}/>
                                            {isNew && (
                                                <Badge variant="filled" size="sm" radius="sm" style={{position: "absolute", top: 8, right: 8, background: "#BAF329", color: "#111111", fontWeight: 700, fontSize: "9px", letterSpacing: "0.5px"}}>
                                                    NEW
                                                </Badge>
                                            )}
                                            {pkg.sale?.active && (
                                                <Badge variant="filled" size="sm" radius="sm" color="red" style={{position: "absolute", top: 8, left: 8, fontWeight: 700}}>
                                                    -{pkg.sale.discount}%
                                                </Badge>
                                            )}
                                        </Box>
                                        <Stack gap={6} p={8}>
                                            <Group gap={4} style={{flexWrap: "wrap", minHeight: "20px"}}>
                                                {productData?.tags && productData.tags.length > 0 ? (
                                                    productData.tags.map((tag: string | TagObject, idx: number) => {
                                                        const tagName = typeof tag === "string" ? tag : tag.name
                                                        const colors = getTagColor(tag)
                                                        return (
                                                            <Badge key={idx} variant="filled" size="xs" radius="sm" styles={{root: {background: colors.bg, color: colors.text, textTransform: "uppercase", fontWeight: 600, fontSize: "8px", letterSpacing: "0.5px"}}}>
                                                                {tagName}
                                                            </Badge>
                                                        )
                                                    })
                                                ) : (
                                                    <Box style={{height: "18px"}}/>
                                                )}
                                            </Group>
                                            <Text fw={600} c="#FFFFFF" style={{fontSize: "0.875rem", lineHeight: "1.3"}}>
                                                {pkg.name}
                                            </Text>
                                            <Group justify="space-between" mt={4}>
                                                <Box>
                                                    {pkg.discount > 0 && pkg.price !== 0 ? (
                                                        <Stack gap={0}>
                                                            <Text size="xs" c="#666666" style={{textDecoration: "line-through", fontSize: "0.7rem"}}>
                                                                {formatPrice(pkg.price, pkg.currency)}
                                                            </Text>
                                                            <Text fw={700} c="#BAF329" size="md">
                                                                {formatPrice(pkg.total_price, pkg.currency)}
                                                            </Text>
                                                        </Stack>
                                                    ) : (
                                                        <Text fw={700} c="#BAF329" size="md">
                                                            {pkg.total_price === 0 ? "FREE" : formatPrice(pkg.total_price, pkg.currency)}
                                                        </Text>
                                                    )}
                                                </Box>
                                                {isInCart(pkg.id) ? (
                                                    <Button size="xs" radius="sm" color="red" onClick={(e) => {e.stopPropagation(), removeItem(pkg.id)}} styles={{root: {height: "24px", fontSize: "0.75rem"}}}>
                                                        Remove
                                                    </Button>
                                                ) : (
                                                    <Button size="xs" radius="sm" leftSection={<IconShoppingCart size={14}/>} onClick={(e) => {e.stopPropagation(), handleAddToCart(pkg)}} styles={{root: {background: "#BAF329", color: "#111111", height: "24px", fontSize: "0.75rem", "&:hover": {background: "#a8db25"}}}}>
                                                        Add
                                                    </Button>
                                                )}
                                            </Group>
                                        </Stack>
                                    </Paper>
                                )
                            })}
                        </Box>
                        {totalPages > 1 && (
                            <Center mt="xl">
                                <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="lime" size="lg" radius="sm" withEdges styles={{control: {"&[data-active]": {background: "#BAF329", color: "#111111", fontWeight: 700}, "&:not([data-active])": {background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#FFFFFF", "&:hover": {background: "#2a2a2a", borderColor: "#BAF329"}}}}}/>
                            </Center>
                        )}
                    </>
                )}
            </Container>
            <Modal opened={showAuthModal} onClose={() => {setShowAuthModal(false), setAuthStep(0), setPendingPackage(null)}} title="Authentication Required" centered size="lg" styles={{header: {background: "#1a1a1a", borderBottom: "1px solid #2a2a2a"}, title: {color: "#FFFFFF", fontWeight: 700, fontSize: "1.5rem"}, body: {background: "#111111", padding: "2rem"}, close: {color: "#FFFFFF", "&:hover": {background: "#2a2a2a"}}}}>
                <Stepper active={authStep} onStepClick={setAuthStep} className={styles.authStepper} styles={{stepIcon: {borderColor: "#2a2a2a", background: "#1a1a1a"}, stepLabel: {color: "#FFFFFF"}, stepDescription: {color: "#666666"}, separator: {background: "#2a2a2a"}}}>
                    <Stepper.Step label="CFX.re Account" description="Link your FiveM account" icon={cfxUser ? <IconCheck size={18}/> : <IconUser size={18}/>}>
                        <Stack gap="md" mt="xl">
                            <Text c="#666666">
                                Link your CFX.re account to continue with your purchase.
                            </Text>
                            {cfxUser ? (
                                <Paper p="md" radius="sm" style={{background: "#1a1a1a", border: "1px solid #2a2a2a"}}>
                                    <Group>
                                        <IconCheck size={24} color="#BAF329"/>
                                        <div>
                                            <Text fw={600} c="#FFFFFF">
                                                Connected as {cfxUser.username}
                                            </Text>
                                            <Text size="sm" c="#666666">
                                                Your CFX.re account is linked
                                            </Text>
                                        </div>
                                    </Group>
                                </Paper>
                            ) : (
                                <Button fullWidth size="lg" radius="sm" leftSection={<IconUser size={20}/>} onClick={handleCFXAuth} styles={{root: {background: "#BAF329", color: "#111111", "&:hover": {background: "#a8db25"}}}}>
                                    Connect CFX.re Account
                                </Button>
                            )}
                        </Stack>
                    </Stepper.Step>
                    <Stepper.Step label="Discord Account" description="Link your Discord account" icon={discordUser ? <IconCheck size={18}/> : <IconBrandDiscord size={18}/>}>
                        <Stack gap="md" mt="xl">
                            <Text c="#666666">
                                Link your Discord account to receive updates and support.
                            </Text>
                            {discordUser ? (
                                <Paper p="md" radius="sm" style={{background: "#1a1a1a", border: "1px solid #2a2a2a"}}>
                                    <Group>
                                        <IconCheck size={24} color="#BAF329"/>
                                        <div>
                                            <Text fw={600} c="#FFFFFF">
                                                Connected as {discordUser.username}
                                            </Text>
                                            <Text size="sm" c="#666666">
                                                Your Discord account is linked
                                            </Text>
                                        </div>
                                    </Group>
                                </Paper>
                            ) : (
                                <Button fullWidth size="lg" radius="sm" leftSection={<IconBrandDiscord size={20}/>} onClick={handleDiscordAuth} styles={{root: {background: "#5865F2", color: "#FFFFFF", "&:hover": {background: "#4752C4"}}}}>
                                    Connect Discord Account
                                </Button>
                            )}
                        </Stack>
                    </Stepper.Step>
                    <Stepper.Completed>
                        <Stack gap="md" mt="xl" align="center">
                            <IconCheck size={48} color="#BAF329"/>
                            <Text size="xl" fw={700} c="#FFFFFF">
                                All Set!
                            </Text>
                            <Text c="#666666" ta="center">
                                Your accounts are linked. Click continue to add the product to your cart.
                            </Text>
                            <Button size="lg" radius="sm" onClick={handleAuthComplete} styles={{root: {background: "#BAF329", color: "#111111", "&:hover": {background: "#a8db25"}}}}>
                                Continue
                            </Button>
                        </Stack>
                    </Stepper.Completed>
                </Stepper>
                {authStep < 2 && (
                    <Group justify="flex-end" mt="xl">
                        <Button variant="outline" radius="sm" onClick={() => {if (authStep === 0 && cfxUser) {setAuthStep(1)} else if (authStep === 1 && discordUser) {handleAuthComplete()}}} disabled={authStep === 0 ? !cfxUser : !discordUser} styles={{root: {borderColor: "#2a2a2a", color: "#FFFFFF", "&:hover": {background: "#2a2a2a"}, "&:disabled": {borderColor: "#2a2a2a", color: "#666666"}}}}>
                            Next Step
                        </Button>
                    </Group>
                )}
            </Modal>
        </Box>
    )
}