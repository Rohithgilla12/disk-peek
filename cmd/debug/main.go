package main

import (
	"fmt"
	"os"
	"path/filepath"
	"syscall"
)

func main() {
	// Test specific folder
	testPath := "/Users/rohithgilla/Library/Group Containers/HUAQ24HBR6.dev.orbstack"

	fmt.Println("Testing block-based size calculation on:", testPath)
	fmt.Println()

	var logicalSize int64
	var actualSize int64
	var fileCount int

	err := filepath.WalkDir(testPath, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}

		// Skip symlinks
		if d.Type()&os.ModeSymlink != 0 {
			return nil
		}

		if !d.IsDir() {
			info, err := d.Info()
			if err == nil {
				fileCount++
				logicalSize += info.Size()

				// Get actual disk usage from block count
				if stat, ok := info.Sys().(*syscall.Stat_t); ok {
					blockSize := stat.Blocks * 512
					actualSize += blockSize

					// Print files where logical != actual
					if info.Size() != blockSize {
						fmt.Printf("SPARSE: %s\n", path)
						fmt.Printf("  Logical: %.2f GB, Actual: %.2f GB\n",
							float64(info.Size())/1e9, float64(blockSize)/1e9)
					}
				} else {
					actualSize += info.Size()
				}
			}
		}

		return nil
	})

	if err != nil {
		fmt.Println("Error:", err)
	}

	fmt.Println()
	fmt.Println("=== Summary ===")
	fmt.Printf("Files: %d\n", fileCount)
	fmt.Printf("Logical size: %.2f GB\n", float64(logicalSize)/1e9)
	fmt.Printf("Actual disk usage: %.2f GB\n", float64(actualSize)/1e9)
	fmt.Printf("Sparse ratio: %.1fx\n", float64(logicalSize)/float64(actualSize))
}
