// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package log

import (
	"fmt"
	"io"
	"os"
	"runtime"
	"strings"
	"sync"
	"time"
)

var logger = New(os.Stdout, NewTextFormatter(), WarningLevel, 3)

const srcPathPrefix = "cloud-native-security-inspector" + string(os.PathSeparator) + "src"

func init() {
	lvl := os.Getenv("LOG_LEVEL")
	if len(lvl) == 0 {
		logger.setLevel(InfoLevel)
		return
	}

	level, err := parseLevel(lvl)
	if err != nil {
		logger.setLevel(InfoLevel)
		return
	}

	logger.setLevel(level)
}

// Logger provides a struct with fields that describe the details of logger.
type Logger struct {
	out       io.Writer
	formatter Formatter
	lvl       Level
	callDepth int
	skipLine  bool
	fields    map[string]interface{}
	fieldsStr string
	mu        *sync.Mutex // ptr here to share one sync.Mutex for clone method
}

// New returns a customized Logger
func New(out io.Writer, formatter Formatter, lvl Level, options ...interface{}) *Logger {
	// Default set to be 3
	depth := 3
	// If passed in as option, then reset depth
	// Use index 0
	if len(options) > 0 {
		d, ok := options[0].(int)
		if ok && d > 0 {
			depth = d
		}
	}

	return &Logger{
		out:       out,
		formatter: formatter,
		lvl:       lvl,
		callDepth: depth,
		fields:    map[string]interface{}{},
		mu:        &sync.Mutex{},
	}
}

// setLevel sets the level of Logger l
func (l *Logger) setLevel(lvl Level) {
	l.mu.Lock()
	defer l.mu.Unlock()

	l.lvl = lvl
}

func (l *Logger) output(entry *Entry) (err error) {
	b, err := l.formatter.Format(entry)
	if err != nil {
		return
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	_, err = l.out.Write(b)
	if err != nil {
		fmt.Println("Log output error")
	}
	return
}

func (l *Logger) Debug(v ...interface{}) {
	if l.lvl <= DebugLevel {
		record := NewEntry(time.Now(), fmt.Sprint(v...), l.getLine(), DebugLevel)
		_ = l.output(record)
	}
}

// Debugf ...
func (l *Logger) Debugf(format string, v ...interface{}) {
	if l.lvl <= DebugLevel {
		record := NewEntry(time.Now(), fmt.Sprintf(format, v...), l.getLine(), DebugLevel) // Callstack depth 2
		_ = l.output(record)
	}
}

// Info ...
func (l *Logger) Info(v ...interface{}) {
	if l.lvl <= InfoLevel {
		record := NewEntry(time.Now(), fmt.Sprint(v...), l.getLine(), InfoLevel) // Callstack depth 2
		_ = l.output(record)
	}
}

// Infof ...
func (l *Logger) Infof(format string, v ...interface{}) {
	if l.lvl <= InfoLevel {
		record := NewEntry(time.Now(), fmt.Sprintf(format, v...), l.getLine(), InfoLevel) // Callstack depth 2
		_ = l.output(record)
	}
}

// Warning ...
func (l *Logger) Warning(v ...interface{}) {
	if l.lvl <= WarningLevel {
		record := NewEntry(time.Now(), fmt.Sprint(v...), l.getLine(), WarningLevel) // Callstack depth 2
		_ = l.output(record)
	}
}

// Warningf ...
func (l *Logger) Warningf(format string, v ...interface{}) {
	if l.lvl <= WarningLevel {
		record := NewEntry(time.Now(), fmt.Sprintf(format, v...), l.getLine(), WarningLevel) // Callstack depth 2
		_ = l.output(record)
	}
}

// Error ...
func (l *Logger) Error(v ...interface{}) {
	if l.lvl <= ErrorLevel {
		record := NewEntry(time.Now(), fmt.Sprint(v...), l.getLine(), ErrorLevel) // Callstack depth 2
		_ = l.output(record)
	}
}

// Errorf ...
func (l *Logger) Errorf(format string, v ...interface{}) {
	if l.lvl <= ErrorLevel {
		record := NewEntry(time.Now(), fmt.Sprintf(format, v...), l.getLine(), ErrorLevel) // Callstack depth 2
		_ = l.output(record)
	}
}

// Fatal ...
func (l *Logger) Fatal(v ...interface{}) {
	if l.lvl <= FatalLevel {
		record := NewEntry(time.Now(), fmt.Sprint(v...), l.getLine(), FatalLevel) // Callstack depth 2
		_ = l.output(record)
	}
	os.Exit(1)
}

// Fatalf ...
func (l *Logger) Fatalf(format string, v ...interface{}) {
	if l.lvl <= FatalLevel {
		record := NewEntry(time.Now(), fmt.Sprintf(format, v...), l.getLine(), FatalLevel) // Callstack depth 2
		_ = l.output(record)
	}
	os.Exit(1)
}

func (l *Logger) getLine() string {
	var str string
	if !l.skipLine {
		str = line(l.callDepth) // Depth 1
	}

	str = str + l.fieldsStr

	if str != "" {
		str = str + ":"
	}

	return str
}

func line(callDepth int) string {
	_, file, line, ok := runtime.Caller(callDepth) // Depth 0
	if !ok {
		file = "???"

		line = 0
	}
	l := strings.SplitN(file, srcPathPrefix, 2)
	if len(l) > 1 {
		file = l[1]
	}
	return fmt.Sprintf("[%s:%d]", file, line)
}

func (l *Logger) clone() *Logger {
	return &Logger{
		out:       l.out,
		formatter: l.formatter,
		lvl:       l.lvl,
		callDepth: l.callDepth,
		skipLine:  l.skipLine,
		fields:    l.fields,
		fieldsStr: l.fieldsStr,
		mu:        l.mu,
	}
}

// SetOutput sets the output of Logger l
func (l *Logger) SetOutput(out io.Writer) {
	l.mu.Lock()
	defer l.mu.Unlock()

	l.out = out
}

// WithDepth returns cloned logger with new depth
func (l *Logger) WithDepth(depth int) *Logger {
	r := l.clone()
	r.callDepth = depth

	return r
}

// Debug ...
func Debug(v ...interface{}) {
	logger.WithDepth(4).Debug(v...)
}

// Debugf ...
func Debugf(format string, v ...interface{}) {
	logger.WithDepth(4).Debugf(format, v...)
}

// Info ...
func Info(v ...interface{}) {
	logger.WithDepth(4).Info(v...)
}

// Infof ...
func Infof(format string, v ...interface{}) {
	logger.WithDepth(4).Infof(format, v...)
}

// Warning  ...
func Warning(v ...interface{}) {
	logger.WithDepth(4).Warning(v...)
}

// Warningf ...
func Warningf(format string, v ...interface{}) {
	logger.WithDepth(4).Warningf(format, v...)
}

// Error ...
func Error(v ...interface{}) {
	logger.WithDepth(4).Error(v...)
}

// Errorf ...
func Errorf(format string, v ...interface{}) {
	logger.WithDepth(4).Errorf(format, v...)
}

// Fatal ...
func Fatal(v ...interface{}) {
	logger.WithDepth(4).Fatal(v...)
}

// Fatalf ...
func Fatalf(format string, v ...interface{}) {
	logger.WithDepth(4).Fatalf(format, v...)
}
