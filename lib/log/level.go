// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package log

import (
	"fmt"
	"strings"
)

// Level ...
type Level int

const (
	// DebugLevel debug
	DebugLevel Level = iota
	// InfoLevel info
	InfoLevel
	// WarningLevel warning
	WarningLevel
	// ErrorLevel error
	ErrorLevel
	// FatalLevel fatal
	FatalLevel
)

const (
	colorRed = uint8(iota + 91)
	colorGreen
	colorYellow
	colorBlue
	colorMagenta = 35
)

func (l Level) string() (lvl string) {
	switch l {
	case DebugLevel:
		debug := "DEBUG"
		lvl = fmt.Sprintf("\x1b[%dm%s\x1b[0m", colorGreen, debug)
	case InfoLevel:
		info := "INFO"
		lvl = fmt.Sprintf("\x1b[%dm%s\x1b[0m", colorBlue, info)
	case WarningLevel:
		warning := "WARNING"
		lvl = fmt.Sprintf("\x1b[%dm%s\x1b[0m", colorYellow, warning)
	case ErrorLevel:
		err := "ERROR"
		lvl = fmt.Sprintf("\x1b[%dm%s\x1b[0m", colorRed, err)
	case FatalLevel:
		fatal := "FATAL"
		lvl = fmt.Sprintf("\x1b[%dm%s\x1b[0m", colorMagenta, fatal)
	default:
		unknow := "UNKNOWN"
		lvl = fmt.Sprintf("\x1b[%dm%s\x1b[0m", colorRed, unknow)
	}

	return
}

func parseLevel(lvl string) (level Level, err error) {
	switch strings.ToLower(lvl) {
	case "debug":
		level = DebugLevel
	case "info":
		level = InfoLevel
	case "warning":
		level = WarningLevel
	case "error":
		level = ErrorLevel
	case "fatal":
		level = FatalLevel
	default:
		err = fmt.Errorf("invalid log level: %s", lvl)
	}

	return
}
