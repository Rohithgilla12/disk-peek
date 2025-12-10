package main

import (
	"fmt"
	"os"
	"time"

	"disk-peek/internal/scanner"
)

func main() {
	// Test the scanner on a directory
	home, _ := os.UserHomeDir()
	testPath := home + "/Library/Caches"

	fmt.Println("Testing scanner on:", testPath)
	fmt.Println()

	// Test WalkDirectoryFast
	fmt.Println("=== WalkDirectoryFast (8 workers) ===")
	start := time.Now()
	result := scanner.WalkDirectoryFast(testPath, 8)
	elapsed := time.Since(start)

	fmt.Printf("Size: %s (%d bytes)\n", scanner.FormatSize(result.Size), result.Size)
	fmt.Printf("Files: %d\n", result.FileCount)
	fmt.Printf("Dirs: %d\n", result.DirCount)
	fmt.Printf("Time: %v\n", elapsed)

	// Test NormalScanner on home directory
	fmt.Println()
	fmt.Println("=== NormalScanner on Home ===")
	ns := scanner.NewNormalScanner(0) // Use default workers
	start = time.Now()
	fullResult := ns.Scan()
	elapsed = time.Since(start)

	fmt.Printf("Total Size: %s\n", scanner.FormatSize(fullResult.TotalSize))
	fmt.Printf("Scan Time: %v\n", elapsed)
	fmt.Printf("Mode: %s\n", fullResult.Mode)

	// Show top children
	if fullResult.Root != nil && len(fullResult.Root.Children) > 0 {
		fmt.Println("\nTop folders by size:")
		count := 10
		if len(fullResult.Root.Children) < count {
			count = len(fullResult.Root.Children)
		}
		for i := 0; i < count; i++ {
			child := fullResult.Root.Children[i]
			fmt.Printf("  %s: %s\n", child.Name, scanner.FormatSize(child.Size))
		}
	}

	fmt.Println()
	fmt.Println("Expected total: ~400-500 GB based on 'du' command")
}
