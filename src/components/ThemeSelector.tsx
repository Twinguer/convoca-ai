import { Palette, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme as useColorTheme, Theme as ColorTheme } from "@/contexts/ThemeContext"
import { useTheme as useDarkTheme } from "next-themes"

const colorThemes: { value: ColorTheme; label: string; color: string }[] = [
  { value: 'emerald', label: 'Verde Esmeralda', color: 'bg-emerald-500' },
  { value: 'rose', label: 'Rosa', color: 'bg-rose-500' },
  { value: 'blue', label: 'Azul', color: 'bg-blue-500' },
  { value: 'slate', label: 'Cinza', color: 'bg-slate-700' },
  { value: 'purple', label: 'Roxo', color: 'bg-purple-500' },
]

export function ThemeSelector() {
  const { theme: colorTheme, setTheme: setColorTheme } = useColorTheme()
  const { theme: darkTheme, setTheme: setDarkTheme } = useDarkTheme()

  const toggleDarkMode = () => {
    setDarkTheme(darkTheme === "dark" ? "light" : "dark")
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Palette className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Selecionar cor do tema</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Cores do Tema</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {colorThemes.map((theme) => (
            <DropdownMenuItem
              key={theme.value}
              onClick={() => setColorTheme(theme.value)}
              className="flex items-center gap-2"
            >
              <div className={`w-4 h-4 rounded-full ${theme.color}`} />
              <span>{theme.label}</span>
              {colorTheme === theme.value && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="icon" onClick={toggleDarkMode}>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Alternar modo escuro</span>
      </Button>
    </div>
  )
}