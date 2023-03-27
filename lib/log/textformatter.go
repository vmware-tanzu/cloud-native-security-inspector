// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package log

import (
	"fmt"
	"time"
)

var defaultTimeFormat = time.RFC3339 // 2006-01-02T15:04:05Z07:00
//var defaultTimeFormat = time.Time{}.Format("2006/01/02 15:04:05")

// TextFormatter represents a kind of formatter that formats the logs as plain text
type TextFormatter struct {
	timeFormat string
}

// NewTextFormatter returns a TextFormatter, the format of time is time.RFC3339
func NewTextFormatter() *TextFormatter {
	return &TextFormatter{
		timeFormat: defaultTimeFormat,
	}
}

// Format formats the logs as "time [level] line message"
func (t *TextFormatter) Format(e *Entry) (b []byte, err error) {
	s := fmt.Sprintf("%s [%s] ", e.Time.Format(t.timeFormat), e.L.string())

	if len(e.Line) != 0 {
		s = s + e.Line + " "
	}

	if len(e.Msg) != 0 {
		s = s + e.Msg
	}

	b = []byte(s)

	if len(b) == 0 || b[len(b)-1] != '\n' {
		b = append(b, '\n')
	}

	return
}

// SetTimeFormat sets time format of TextFormatter if the parameter fmt is not null
func (t *TextFormatter) SetTimeFormat(fmt string) {
	if len(fmt) != 0 {
		t.timeFormat = fmt
	}
}
